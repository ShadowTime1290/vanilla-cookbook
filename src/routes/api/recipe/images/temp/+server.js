import { saveFile, validImageTypes } from '$lib/utils/import/importHelpers'
import { fileTypeFromBuffer } from 'file-type'
import { promises as fsPromises } from 'fs'
import path from 'path'
import crypto from 'crypto'

export async function POST({ request, locals }) {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		return new Response('User not authenticated', {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const formData = await request.formData()
	const imageData = formData.getAll('images')
	if (!imageData.length) {
		return new Response(JSON.stringify({ photos: [] }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const directory = path.join('uploads', 'temp')
	await fsPromises.mkdir(directory, { recursive: true })

	const createdPhotos = []

	for (const file of imageData) {
		try {
			const photoBuffer = await file.arrayBuffer()
			const fileTypeResult = await fileTypeFromBuffer(photoBuffer)
			if (!fileTypeResult || !validImageTypes.includes(fileTypeResult.ext)) {
				throw new Error('Invalid image type.')
			}

			const extension = fileTypeResult.ext
			const filename = `${user.userId}_${crypto.randomUUID()}.${extension}`
			await saveFile(photoBuffer, filename, directory)

			createdPhotos.push({
				filename,
				fileType: extension,
				url: `/api/recipe/image/temp/${filename}`
			})
		} catch (err) {
			console.error('Error saving temp photo:', err)
		}
	}

	return new Response(JSON.stringify({ photos: createdPhotos }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	})
}
