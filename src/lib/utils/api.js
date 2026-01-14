import { prisma } from '$lib/server/prisma'

/**
 * Creates a new recipe photo entry in the database.
 *
 * @param {string} recipeUid - Unique identifier for the recipe.
 * @param {string} imageUrl - URL of the photo.
 * @param {string} fileType - The file type of the photo.
 * @param {boolean} [isMain=false] - Flag indicating if the photo is the main image.
 * @returns {Promise<Object>} A promise that resolves to the created recipe photo entry.
 */
export async function createRecipePhotoEntry(recipeUid, imageUrl, fileType, isMain = false) {
	const latestPhoto = await prisma.recipePhoto.findFirst({
		where: { recipeUid },
		orderBy: { sortOrder: 'desc' },
		select: { sortOrder: true }
	})
	const nextSortOrder =
		typeof latestPhoto?.sortOrder === 'number' ? latestPhoto.sortOrder + 1 : 0

	return await prisma.recipePhoto.create({
		data: {
			recipeUid: recipeUid,
			url: imageUrl,
			fileType: fileType,
			isMain: isMain,
			sortOrder: nextSortOrder
		}
	})
}

/**
 * Removes a recipe photo entry from the database.
 *
 * @param {number|string} uid - Unique identifier for the photo entry to be removed.
 * @returns {Promise<void>} A promise that resolves when the entry has been deleted.
 */
export async function removeRecipePhotoEntry(uid) {
	await prisma.recipePhoto.delete({
		where: { id: uid }
	})
}
