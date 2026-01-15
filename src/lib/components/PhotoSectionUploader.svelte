<script>
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte'
	import PhotoCard from '$lib/components/PhotoCard.svelte'

	/** @type {{
		photos?: any[],
		onPhotosChange?: (photos: any[]) => void,
		onUpload?: (files: File[], onProgress?: (percent: number) => void) => Promise<any>,
		onUploadSuccess?: (photos: any[]) => void,
		onDelete?: (photo: any) => Promise<boolean> | boolean,
		onReorder?: (photos: any[]) => Promise<void> | void,
		normalizePhotos?: (photos: any[]) => any[],
		getPhotoId?: (photo: any) => string | number,
		getPhotoSrc?: (photo: any) => string,
		isMainPhoto?: (photo: any) => boolean,
		showCoverBadge?: boolean,
		showMainRing?: boolean,
		showSetMain?: boolean,
		confirmDelete?: boolean,
		uploadLabel?: string,
		class?: string,
		coverBadgeText?: string,
		removeButtonSize?: string,
		removeButtonOffset?: string,
		removeButtonRadius?: string,
		hoverOutlineColor?: string,
		hoverOutlineWidth?: string,
		hoverOutlineOffset?: string
	}} */
	let {
		photos = $bindable([]),
		onPhotosChange,
		onUpload,
		onUploadSuccess,
		onDelete,
		onReorder,
		normalizePhotos,
		getPhotoId,
		getPhotoSrc,
		isMainPhoto,
		showCoverBadge = false,
		showMainRing = false,
		showSetMain = false,
		confirmDelete = false,
		uploadLabel = 'Upload Images',
		class: className = '',
		coverBadgeText = 'Cover',
		removeButtonSize = '2.2rem',
		removeButtonOffset = '-0.5rem',
		removeButtonRadius = '0.5rem',
		hoverOutlineColor = 'rgba(37, 99, 235, 0.45)',
		hoverOutlineWidth = '2px',
		hoverOutlineOffset = '2px'
	} = $props()

	let uploadingPhotos = $state(false)
	let uploadError = $state('')
	let uploadProgress = $state(0)
	let uploadCompleted = $state(false)
	let uploadCompleteTimer = null
	let draggingPhotoId = $state(null)
	let dropTargetId = $state(null)
	let showDeleteConfirm = $state(false)
	let pendingDeletePhoto = $state(null)

	const resolvePhotoId = (photo) =>
		getPhotoId ? getPhotoId(photo) : photo?.id ?? photo?.filename
	const resolvePhotoSrc = (photo) => (getPhotoSrc ? getPhotoSrc(photo) : photo?.url)
	const resolveIsMain = (photo) => (isMainPhoto ? isMainPhoto(photo) : !!photo?.isMain)

	async function updatePhotoList(nextPhotos, persistReorder = true) {
		const normalized = normalizePhotos ? normalizePhotos(nextPhotos) : nextPhotos
		photos = normalized
		onPhotosChange && onPhotosChange(normalized)
		if (persistReorder && onReorder) {
			const result = onReorder(normalized)
			if (result?.then) {
				await result
			}
		}
	}

	async function handleFilesChange(event) {
		if (!onUpload) return
		const inputEvent = event?.detail ?? event
		const input = inputEvent?.target
		const files = Array.from(input?.files ?? [])
		if (!files.length) return

		if (uploadCompleteTimer) {
			clearTimeout(uploadCompleteTimer)
			uploadCompleteTimer = null
		}

		uploadError = ''
		uploadProgress = 0
		uploadCompleted = false
		uploadingPhotos = true

		try {
			const result = await onUpload(files, (percent) => {
				uploadProgress = percent
			})
			if (!result?.success) {
				uploadError = result?.error || 'Failed to upload photos.'
				return
			}
			const merged = [...photos, ...(result.data ?? [])]
			await updatePhotoList(merged, false)
			onUploadSuccess && onUploadSuccess(merged)
			uploadProgress = 100
			uploadCompleted = true
			uploadCompleteTimer = setTimeout(() => {
				uploadingPhotos = false
				uploadCompleted = false
				uploadProgress = 0
			}, 350)
		} catch (error) {
			console.error('Error uploading photos:', error)
			uploadError = 'Failed to upload photos.'
		} finally {
			if (input) input.value = ''
			if (!uploadCompleted) {
				uploadingPhotos = false
				uploadProgress = 0
			}
		}
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
		const fromIndex = photos.findIndex((photo) => resolvePhotoId(photo) === sourcePhotoId)
		const toIndex = photos.findIndex((photo) => resolvePhotoId(photo) === targetPhotoId)
		if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return

		const nextPhotos = [...photos]
		const [moved] = nextPhotos.splice(fromIndex, 1)
		nextPhotos.splice(toIndex, 0, moved)
		await updatePhotoList(nextPhotos)
	}

	async function handleSetMainPhoto(photo) {
		const targetId = resolvePhotoId(photo)
		const mainIndex = photos.findIndex((item) => resolvePhotoId(item) === targetId)
		if (mainIndex < 0) return
		const nextPhotos = [...photos]
		const [mainPhoto] = nextPhotos.splice(mainIndex, 1)
		nextPhotos.unshift(mainPhoto)
		await updatePhotoList(nextPhotos)
	}

	async function handleDeletePhoto(photo) {
		if (!onDelete) return
		const deleted = await onDelete(photo)
		if (!deleted) return
		const targetId = resolvePhotoId(photo)
		const nextPhotos = photos.filter((item) => resolvePhotoId(item) !== targetId)
		await updatePhotoList(nextPhotos)
	}

	function requestDelete(photo) {
		if (confirmDelete) {
			pendingDeletePhoto = photo
			showDeleteConfirm = true
			return
		}
		handleDeletePhoto(photo)
	}

	async function handleConfirmDelete() {
		const photo = pendingDeletePhoto
		showDeleteConfirm = false
		pendingDeletePhoto = null
		if (photo) {
			await handleDeletePhoto(photo)
		}
	}
</script>

<div class={['photo-uploader', className].filter(Boolean).join(' ')}>
	{#if uploadingPhotos}
		<div class="form-control w-full">
			<label class="label">
				<span class="label-text">Uploading photos... {uploadProgress}%</span>
			</label>
			<div
				class="upload-progress"
				role="progressbar"
				aria-label="Uploading photos"
				aria-valuemin="0"
				aria-valuemax="100"
				aria-valuenow={uploadProgress}>
				<span
					class="upload-progress__bar"
					class:upload-complete={uploadCompleted}
					style={`width: ${uploadProgress}%`}></span>
			</div>
		</div>
	{:else}
		<FileInput id="file" label={uploadLabel} name="images" on:change={handleFilesChange} multiple />
	{/if}
	{#if uploadError}
		<p class="text-xs text-red-600 mt-1">{uploadError}</p>
	{/if}

	{#if photos.length}
		<p class="text-xs mt-2">Drag photos to reorder them. The first photo is the cover photo.</p>
		<div class="flex flex-wrap gap-4 mb-4 mt-4">
			{#each photos as photo, index}
				<PhotoCard
					photo={photo}
					index={index}
					photoSrc={resolvePhotoSrc(photo)}
					isMain={resolveIsMain(photo)}
					showCoverBadge={showCoverBadge}
					showMainRing={showMainRing}
					showSetMain={showSetMain}
					coverBadgeText={coverBadgeText}
					removeButtonSize={removeButtonSize}
					removeButtonOffset={removeButtonOffset}
					removeButtonRadius={removeButtonRadius}
					hoverOutlineColor={hoverOutlineColor}
					hoverOutlineWidth={hoverOutlineWidth}
					hoverOutlineOffset={hoverOutlineOffset}
					isDragging={resolvePhotoId(photo) === draggingPhotoId}
					isDropTarget={resolvePhotoId(photo) === dropTargetId}
					onDelete={requestDelete}
					onSetMain={handleSetMainPhoto}
					onDragStart={(event) => handleDragStart(event, resolvePhotoId(photo))}
					onDragOver={(event) => handleDragOver(event, resolvePhotoId(photo))}
					onDragLeave={() => handleDragLeave(resolvePhotoId(photo))}
					onDrop={(event) => handleDrop(event, resolvePhotoId(photo))}
					onDragEnd={handleDragEnd} />
			{/each}
		</div>
	{/if}

	<ConfirmationDialog
		bind:isOpen={showDeleteConfirm}
		onClose={() => (showDeleteConfirm = false)}
		onConfirm={handleConfirmDelete}>
		{#snippet content()}
			<h3 class="font-bold text-lg">Delete Photo</h3>
			<p class="py-4">Are you sure you want to delete this photo?</p>
		{/snippet}
	</ConfirmationDialog>
</div>

<style lang="scss">
	.upload-progress {
		position: relative;
		height: 2.5rem;
		border: 1px solid var(--color-primary);
		border-radius: var(--pico-border-radius, 0.375rem);
		background: var(--pico-background-color, transparent);
		overflow: hidden;
	}

	.upload-progress__bar {
		display: block;
		height: 100%;
		width: 0%;
		background: var(--color-primary);
		transition: width 0.45s ease-out;
	}
</style>
