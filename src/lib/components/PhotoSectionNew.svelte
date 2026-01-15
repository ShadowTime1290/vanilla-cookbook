<script>
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import {
		deleteTempRecipePhoto,
		uploadTempRecipePhotos
	} from '$lib/utils/crud'

	/** @type {{recipe: any, imageExists: any, tempPhotos?: any[], onTempPhotosChange?: (photos: any[]) => void}} */
	let { recipe, imageExists, tempPhotos = $bindable([]), onTempPhotosChange } = $props()

	let uploadingPhotos = $state(false)
	let uploadError = $state('')
	let uploadProgress = $state(0)
	let uploadCompleted = $state(false)
	let uploadCompleteTimer = null

	async function handleFilesChange(event) {
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
			const result = await uploadTempRecipePhotos(files, (percent) => {
				uploadProgress = percent
			})
			if (!result?.success) {
				uploadError = result?.error || 'Failed to upload photos.'
				uploadingPhotos = false
				uploadCompleted = false
				uploadProgress = 0
				return
			}
			const merged = [...tempPhotos, ...(result.data ?? [])]
			tempPhotos = merged
			onTempPhotosChange && onTempPhotosChange(merged)
			if (input) input.value = ''
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
			uploadingPhotos = false
			uploadCompleted = false
			uploadProgress = 0
		}
	}

	async function handleDeleteTempPhoto(photo) {
		if (!photo?.filename) return
		const deleted = await deleteTempRecipePhoto(photo.filename)
		if (!deleted) return
		tempPhotos = tempPhotos.filter((item) => item.filename !== photo.filename)
		onTempPhotosChange && onTempPhotosChange(tempPhotos)
	}
</script>

{#if recipe.image_url && imageExists}
	<img
		class="w-32 h-auto object-cover rounded-lg shadow-md mb-4"
		loading="lazy"
		src={recipe.image_url}
		alt="{recipe.image_url} thumbnail" />
{/if}

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
	<FileInput id="file" label="Upload Images" name="images" on:change={handleFilesChange} multiple />
{/if}
{#if uploadError}
	<p class="text-xs text-red-600 mt-1">{uploadError}</p>
{/if}

{#if tempPhotos.length}
	<div class="flex flex-wrap gap-3 mb-4 mt-4">
		{#each tempPhotos as photo}
			<div class="photo-card flex flex-col items-center gap-2">
				<img
					src={photo.url}
					alt="Recipe photo"
					class="max-h-40 rounded-lg shadow-md" />
				<Button
					size="sm"
					style="soft"
					color="secondary"
					type="button"
					onclick={() => handleDeleteTempPhoto(photo)}>
					<Delete width="24px" height="24px" />
				</Button>
			</div>
		{/each}
	</div>
{/if}

<style lang="scss">
	.photo-card {
		cursor: default;
	}

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
