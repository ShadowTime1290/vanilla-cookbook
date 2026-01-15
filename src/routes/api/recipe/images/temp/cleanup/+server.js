import { promises as fsPromises } from 'fs'
import path from 'path'

export async function POST({ request, locals }) {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		return new Response('User not authenticated', {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	let payload = null
	try {
		payload = await request.json()
	} catch (error) {
		payload = null
	}

	const files = Array.isArray(payload?.files) ? payload.files : []
	if (!files.length) {
		return new Response(JSON.stringify({ deleted: 0 }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const directory = path.join(process.cwd(), 'uploads', 'temp')
	let deleted = 0

	for (const filename of files) {
		if (typeof filename !== 'string') continue
		if (!filename.startsWith(`${user.userId}_`)) continue
		const filePath = path.join(directory, filename)
		try {
			await fsPromises.unlink(filePath)
			deleted += 1
		} catch (error) {
			if (error?.code !== 'ENOENT') {
				console.error('Failed to delete temp photo:', filename, error)
			}
		}
	}

	return new Response(JSON.stringify({ deleted }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	})
}
