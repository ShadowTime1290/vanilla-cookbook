<script>
	import Delete from '$lib/components/svg/Delete.svelte'
	import UpArrow from '$lib/components/svg/UpArrow.svelte'

import { deletePhotoById, updatePhotos, uploadRecipePhotos } from '$lib/utils/crud'
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte'

	/** @type {{recipe: any, selectedFiles: any}} */
	let { recipe, onSelectedFilesChange } = $props()

	let filteredPhotos = $state()
	let showDeleteConfirm = $state(false)
let pendingPhotoId = $state(null)
let draggingPhotoId = $state(null)
let dropTargetId = $state(null)
let uploadingPhotos = $state(false)
let uploadError = $state('')

$effect(() => {
	filteredPhotos =
		recipe && recipe.photos
			? recipe.photos
					.filter((photo) => photo.fileType)
					.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
			: []
})

	async function handleDeletePhoto(photoId) {
		pendingPhotoId = photoId
		showDeleteConfirm = true
	}

	async function handleSetMainPhoto(mainPhotoId) {
		const mainIndex = filteredPhotos.findIndex((photo) => photo.id === mainPhotoId)
		if (mainIndex < 0) return
		const updatedPhotos = [...filteredPhotos]
		const [mainPhoto] = updatedPhotos.splice(mainIndex, 1)
		updatedPhotos.unshift(mainPhoto)
		filteredPhotos = applySortOrder(updatedPhotos)

		const success = await updatePhotos(buildPhotoUpdatePayload(filteredPhotos))
		if (!success) {
			console.error('Failed to set the main photo.')
		} else {
			// Handle the success e.g. show a success notification
		}
	}

function handleFilesChange(event) {
	const inputEvent = event?.detail ?? event
	const input = inputEvent?.target
	const files = Array.from(input?.files ?? [])
	if (!files.length) return

	uploadError = ''
	uploadingPhotos = true
	uploadRecipePhotos(recipe.uid, files)
		.then((result) => {
			if (!result?.success) {
				uploadError = result?.error || 'Failed to upload photos.'
				return
			}
			if (result.data?.length) {
				const merged = [...filteredPhotos, ...result.data].sort(
					(a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
				)
				filteredPhotos = merged
			}
			onSelectedFilesChange && onSelectedFilesChange([])
		})
		.catch((error) => {
			console.error('Error uploading photos:', error)
			uploadError = 'Failed to upload photos.'
		})
		.finally(() => {
			uploadingPhotos = false
			if (input) input.value = ''
		})
}

	async function confirmDelete() {
		const photoId = pendingPhotoId
		showDeleteConfirm = false
		if (!photoId) return
		try {
			// Determine if the photo being deleted is the main photo.
			const isMainPhotoBeingDeleted = filteredPhotos.some(
				(photo) => photo.id === photoId && photo.isMain
			)
			const photoDeleted = await deletePhotoById(photoId)
			if (!photoDeleted) return

			filteredPhotos = filteredPhotos.filter((p) => p.id !== photoId)

			if (isMainPhotoBeingDeleted) {
				const newMainPhoto = filteredPhotos[0]
				if (newMainPhoto) {
					handleSetMainPhoto(newMainPhoto.id)
				}
			}
		} catch (error) {
			console.error('Error deleting photo:', error.message)
		}
	}

	function applySortOrder(photos) {
		return photos.map((photo, index) => ({
			...photo,
			sortOrder: index,
			isMain: index === 0
		}))
	}

	function buildPhotoUpdatePayload(photos) {
		return photos.map((photo, index) => ({
			id: photo.id,
			isMain: photo.isMain,
			notes: photo.notes ?? null,
			sortOrder: typeof photo.sortOrder === 'number' ? photo.sortOrder : index
		}))
	}

	function handleDragStart(event, photoId) {
		draggingPhotoId = photoId
		event.dataTransfer?.setData('text/plain', String(photoId))
		event.dataTransfer?.setDragImage?.(event.currentTarget, 20, 20)
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
	}

	function handleDragOver(event, photoId) {
		if (!draggingPhotoId || draggingPhotoId === photoId) return
		event.preventDefault()
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
		dropTargetId = photoId
	}

	function handleDragLeave(photoId) {
		if (dropTargetId === photoId) {
			dropTargetId = null
		}
	}

	function handleDragEnd() {
		draggingPhotoId = null
		dropTargetId = null
	}

	async function handleDrop(event, targetPhotoId) {
		event.preventDefault()
		const sourcePhotoId = draggingPhotoId
		handleDragEnd()

		if (!sourcePhotoId || sourcePhotoId === targetPhotoId) return
		const fromIndex = filteredPhotos.findIndex((photo) => photo.id === sourcePhotoId)
		const toIndex = filteredPhotos.findIndex((photo) => photo.id === targetPhotoId)
		if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return

		const nextPhotos = [...filteredPhotos]
		const [moved] = nextPhotos.splice(fromIndex, 1)
		nextPhotos.splice(toIndex, 0, moved)
		filteredPhotos = applySortOrder(nextPhotos)

		const success = await updatePhotos(buildPhotoUpdatePayload(filteredPhotos))
		if (!success) {
			console.error('Failed to update photo order.')
		}
	}
</script>

<FileInput id="file" label="Upload Images" name="images" on:change={handleFilesChange} multiple />
<p class="text-xs mt-2">
	Drag photos to reorder them. The first photo is the cover photo.
	{#if uploadingPhotos}
		<span> Uploading...</span>
	{/if}
</p>
{#if uploadError}
	<p class="text-xs text-red-600 mt-1">{uploadError}</p>
{/if}

<div class="flex flex-wrap gap-3 mb-4 mt-4">
	{#each filteredPhotos as photo}
		<div
			class="photo-card flex flex-col items-center gap-2"
			class:is-dragging={photo.id === draggingPhotoId}
			class:is-drop-target={photo.id === dropTargetId}
			draggable="true"
			on:dragstart={(event) => handleDragStart(event, photo.id)}
			on:dragover={(event) => handleDragOver(event, photo.id)}
			on:dragleave={() => handleDragLeave(photo.id)}
			on:drop={(event) => handleDrop(event, photo.id)}
			on:dragend={handleDragEnd}>
			<img
				src="/api/recipe/image/{photo.id}"
				alt="{recipe.name} photo"
				class="max-h-40 rounded-lg shadow-md {photo.isMain ? 'ring-4 ring-primary' : ''}" />
			<div class="flex gap-2">
				<Button
					size="sm"
					style="soft"
					color="secondary"
					type="button"
					onclick={() => handleDeletePhoto(photo.id)}>
					<Delete width="24px" height="24px" />
				</Button>
				{#if !photo.isMain}
					<div class="tooltip" data-tip="Promote to Main Photo">
						<Button
							size="sm"
							style="soft"
							color="secondary"
							type="button"
							onclick={() => handleSetMainPhoto(photo.id)}>
							<UpArrow width="24px" height="24px" />
						</Button>
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>

<ConfirmationDialog
	bind:isOpen={showDeleteConfirm}
	onClose={() => (showDeleteConfirm = false)}
	onConfirm={confirmDelete}>
	{#snippet content()}
		<h3 class="font-bold text-lg">Delete Photo</h3>
		<p class="py-4">Are you sure you want to delete this photo?</p>
	{/snippet}
</ConfirmationDialog>

<style lang="scss">
	.photo-card {
		cursor: grab;
	}

	.photo-card.is-dragging {
		opacity: 0.6;
		cursor: grabbing;
	}

	.photo-card.is-drop-target {
		outline: 2px dashed var(--pico-primary, #2563eb);
		outline-offset: 4px;
	}
</style>
