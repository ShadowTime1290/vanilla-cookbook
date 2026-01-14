import { prisma } from '$lib/server/prisma'
import { createRecipePhotoEntry, removeRecipePhotoEntry } from '$lib/utils/api'
import { mapContentTypeToFileTypeAndExtension } from '$lib/utils/image/imageUtils.js'
import { saveFile, validImageTypes } from '$lib/utils/import/importHelpers'
import { fileTypeFromBuffer } from 'file-type'

export async function POST({ request, locals, params }) {
	const session = await locals.auth.validate()
	const user = session?.user
	const { uid } = params

	if (!session || !user) {
		return new Response('User not authenticated', {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	const recipe = await prisma.recipe.findUnique({
		where: { uid }
	})

	if (!recipe) {
		return new Response(JSON.stringify({ error: 'Recipe not found.' }), {
			status: 404,
			headers: { 'Content-Type': 'application/json' }
		})
	}

	if (recipe.userId !== user.userId) {
		return new Response(JSON.stringify({ error: 'Unauthorized to upload photos.' }), {
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

	const existingMain = await prisma.recipePhoto.findFirst({
		where: { recipeUid: uid, isMain: true },
		select: { id: true }
	})
	const shouldSetMain = !existingMain
	const createdPhotos = []

	for (let index = 0; index < imageData.length; index++) {
		const file = imageData[index]
		let photoEntry
		try {
			const extension = mapContentTypeToFileTypeAndExtension(file.type).extension
			const isMain = shouldSetMain && index === 0
			photoEntry = await createRecipePhotoEntry(recipe.uid, null, extension, isMain)
			const photoBuffer = await file.arrayBuffer()

			const fileTypeResult = await fileTypeFromBuffer(photoBuffer)
			if (!fileTypeResult || !validImageTypes.includes(fileTypeResult.ext)) {
				throw new Error('Invalid image type.')
			}

			const directory = 'uploads/images'
			const fullFilename = `${photoEntry.id}.${extension}`
			await saveFile(photoBuffer, fullFilename, directory)

			createdPhotos.push({
				id: photoEntry.id,
				url: photoEntry.url,
				fileType: photoEntry.fileType,
				isMain: photoEntry.isMain,
				notes: photoEntry.notes ?? null,
				sortOrder: photoEntry.sortOrder
			})
		} catch (err) {
			if (photoEntry?.id) {
				await removeRecipePhotoEntry(photoEntry.id)
			}
			console.error('Error saving photo:', err)
		}
	}

	return new Response(JSON.stringify({ photos: createdPhotos }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	})
}
