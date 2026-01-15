<script>
	import { onDestroy, onMount } from 'svelte'
	import { beforeNavigate, goto } from '$app/navigation'
	import { createRecipe } from '$lib/utils/crud'
	import { handleScrape } from '$lib/utils/parse/parseHelpersClient'
	import RecipeNewScrape from '$lib/components/RecipeNewScrape.svelte'
	import RecipeForm from '$lib/components/RecipeForm.svelte'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import { defaultRecipe } from '$lib/utils/config'

	/**
	 * The scraped recipe object.
	 * @property {string} name - Name of the recipe.
	 * @property {string} source - Source of the recipe.
	 * @property {string} source_url - URL source of the recipe.
	 * @property {string} cook_time - Cook time of the recipe.
	 * @property {string} image_url - Image URL of the recipe.
	 * @property {string} prep_time - Preparation time of the recipe.
	 * @property {string} ingredients - Ingredients of the recipe.
	 * @property {string} directions - Directions of the recipe.
	 * @property {string} total_time - Total time of the recipe.
	 * @property {string} servings - Servings of the recipe.
	 * @property {string} nutritional_info - Nutritional information of the recipe.
	 */

	let recipe = $state({ ...defaultRecipe })

	let url = $state(null)
	let sharedText = $state(null)
	let feedbackMessage = $state('')
	let feedbackType = $state('info')
	let tempPhotos = $state([])
	let cleanupTriggered = false
	let allowLeave = $state(false)
	const unsavedWarning = 'You have unsaved changes. Are you sure you want to leave?'

	let initialMode = $state('url') // 'url' | 'text' | 'image'

	let { data } = $props()

	let { apiKeyPresent, aiEnabled, imageAllowed, userUnits, userLanguage } = $state(data)

	/**
	 * Handles the scraping event.
	 * @param {Event} event - The scrape event.
	 * @returns {Promise<void>}
	 */

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search)
		let rawUrl = urlParams.get('url')
		let text = urlParams.get('text')

		if (!rawUrl && text && /^https?:\/\//.test(text)) {
			rawUrl = text
		}

		url = rawUrl
		sharedText = !rawUrl ? text : null

		if (url) {
			url = decodeURIComponent(url)
			initialMode = 'url'
			try {
				feedbackMessage = 'Scraping URL...'
				feedbackType = 'info'
				const scrapedData = await handleScrape(null, url)
				if (scrapedData) {
					recipe = { ...recipe, ...scrapedData }
					feedbackMessage = scrapedData._status === 'complete' ? 'URL scraped successfully.' : ''
				}
			} catch (error) {
				console.error('Error during scrape:', error)
				feedbackMessage = 'Error scraping URL.'
				feedbackType = 'error'
			}
		} else if (sharedText && apiKeyPresent && aiEnabled) {
			initialMode = 'text'
		} else if (sharedText && (!apiKeyPresent || !aiEnabled)) {
			initialMode = 'text'
			feedbackMessage = 'AI not enabled!'
		}
	})

	async function handleCreateRecipe(event) {
		event.preventDefault() // Prevent default form submission

		const result = await createRecipe({
			...recipe,
			tempPhotos: tempPhotos.map((photo) => photo.filename)
		})
		if (result.success) {
			tempPhotos = []
			cleanupTriggered = true
			allowLeave = true
			// Handle success, maybe redirect or show a success message
			await goto(`/recipe/${result.data.uid}/view/`)
		} else {
			console.error('Error:', result.error)
		}
	}

	function handleTempPhotosChange(photos) {
		tempPhotos = photos
	}

	function hasUnsavedChanges() {
		if (allowLeave) return false
		if (tempPhotos.length) return true
		const base = defaultRecipe ?? {}
		return Object.keys(recipe ?? {}).some((key) => {
			const value = recipe[key]
			const baseValue = base[key]
			if (value === undefined || value === null || value === '') return false
			return value !== baseValue
		})
	}

	function cleanupTempPhotos() {
		if (cleanupTriggered || !tempPhotos.length) return
		cleanupTriggered = true
		const filenames = tempPhotos.map((photo) => photo.filename).filter(Boolean)
		if (!filenames.length) return
		fetch('/api/recipe/images/temp/cleanup', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ files: filenames }),
			keepalive: true
		}).catch((error) => {
			console.error('Error cleaning up temp photos:', error)
		})
	}

	onDestroy(() => {
		cleanupTempPhotos()
	})

	onMount(() => {
		const handlePageHide = () => cleanupTempPhotos()
		const handleBeforeUnload = (event) => {
			if (!hasUnsavedChanges()) return
			event.preventDefault()
			event.returnValue = ''
		}
		window.addEventListener('pagehide', handlePageHide)
		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => {
			window.removeEventListener('pagehide', handlePageHide)
			window.removeEventListener('beforeunload', handleBeforeUnload)
		}
	})

	beforeNavigate(({ cancel }) => {
		if (!hasUnsavedChanges()) return
		if (!confirm(unsavedWarning)) cancel()
	})
</script>

<RecipeNewScrape
	bind:url
	bind:sharedText
	bind:recipe
	{apiKeyPresent}
	{aiEnabled}
	{initialMode}
	{imageAllowed}
	{userUnits}
	{userLanguage} />

<RecipeForm
	bind:recipe
	bind:tempPhotos
	onSubmit={handleCreateRecipe}
	onTempPhotosChange={handleTempPhotosChange}
	{aiEnabled}
	{userUnits}
	{userLanguage} />

{#if feedbackMessage}
	<FeedbackMessage message={feedbackMessage} type={feedbackType} timeout={4000} />
{/if}
