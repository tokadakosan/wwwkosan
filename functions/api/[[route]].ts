import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handle } from 'hono/cloudflare-pages'
import * as jwt from '@tsndr/cloudflare-worker-jwt'

type Bindings = {
    GOOGLE_PRIVATE_KEY: string
    GOOGLE_CLIENT_EMAIL: string
    SHEET_ID: string
}

const app = new Hono<{ Bindings: Bindings }>().basePath('/api')

app.use('/*', cors())

async function getGoogleToken(env: Bindings, scopes: string[]) {
    const privateKey = env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    const jwtToken = await jwt.sign({
        iss: env.GOOGLE_CLIENT_EMAIL,
        scope: scopes.join(' '),
        aud: 'https://oauth2.googleapis.com/token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
    }, privateKey, { algorithm: 'RS256' })

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwtToken}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    if (!tokenRes.ok) {
        throw new Error('Google認証エラーが発生しました')
    }

    const data = await tokenRes.json() as { access_token: string }
    return data.access_token
}

app.post('/submit', async (c) => {
    try {
        const body = await c.req.json()
        const { name, tepra, memo } = body

        if (!name || !tepra) {
            return c.json({ error: '氏名とテプラ番号は必須です' }, 400)
        }

        // 1. Google Sheets API 用トークン取得 (読み取り権限のみ)
        const access_token = await getGoogleToken(c.env, ['https://www.googleapis.com/auth/spreadsheets.readonly'])

        // 2. マスタシートを検索してテプラ番号が存在するか確認およびパスワード取得
        const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${c.env.SHEET_ID}/values/シート1!A:B`
        const readRes = await fetch(readUrl, {
            headers: { Authorization: `Bearer ${access_token}` }
        })

        let isTepraRegistered = false
        let retrievedPassword = ""
        if (readRes.ok) {
            const data = await readRes.json() as any
            const rows: string[][] = data.values || []
            const match = rows.find(row => row[0] === tepra)
            if (match) {
                isTepraRegistered = true
                retrievedPassword = match[1] || ""
            }
        }

        // 3. PowerAutomateへのHTTPS POST 通知
        const POST_URL = "https://default74ab15b298574c4f824265f0774be4.94.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c2a3d8d6f5c7483eb3487e28bf956596/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=aF9VG14yypqZhdx0lpZtGhej2lObe1GMTG4Moxnr218"
        const CHANNEL_ID = "121628039"

        const messageText = `${name}から備品連絡フォームで連絡がありました\n(ラベル：${tepra})\n連絡事項: ${memo || ''}\n通知したパスワード: ${retrievedPassword}\n`

        const payload = {
            "channel": CHANNEL_ID,
            "message": messageText
        }

        try {
            const response = await fetch(POST_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            console.log("POST Response:", await response.text());
        } catch (err) {
            console.error("POST Error:", err);
        }

        // 4. 完了後、フロントへパスワードを含めて返す。未登録なら空文字にする。
        return c.json({ message: isTepraRegistered ? retrievedPassword : '' })

    } catch (error: any) {
        console.error('Unexpected Error:', error)
        return c.json({ error: 'サーバーエラーが発生しました', details: error.message }, 500)
    }
})

export const onRequest = handle(app)
