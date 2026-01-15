import fs from 'fs'
import path from 'path'

export async function GET({ params, locals }) {
	const session = await locals.auth.validate()
	const user = session?.user
	const { filename } = params

	if (!session || !user) {
		return new Response('User not authenticated', {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	if (!filename || !filename.startsWith(`${user.userId}_`)) {
		return new Response('Unauthorized', {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const filePath = path.join(process.cwd(), 'uploads', 'temp', filename)
	if (!fs.existsSync(filePath)) {
		return new Response(null, { status: 204 })
	}

	const fileType = filename.split('.').pop() || 'jpeg'
	const file = fs.readFileSync(filePath)
	return new Response(file, {
		headers: {
			'Content-Type': `image/${fileType}`
		}
	})
}

export async function DELETE({ params, locals }) {
	const session = await locals.auth.validate()
	const user = session?.user
	const { filename } = params

	if (!session || !user) {
		return new Response('User not authenticated', {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	if (!filename || !filename.startsWith(`${user.userId}_`)) {
		return new Response('Unauthorized', {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const filePath = path.join(process.cwd(), 'uploads', 'temp', filename)
	if (fs.existsSync(filePath)) {
		await fs.promises.unlink(filePath)
	}

	return new Response(null, { status: 204 })
}
