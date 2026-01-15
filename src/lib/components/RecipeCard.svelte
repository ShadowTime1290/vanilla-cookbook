<!-- RecipeCard.svelte -->
<script>
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import StarRating from '$lib/components/StarRating.svelte'
	import { changeRecipeFavourite } from '$lib/utils/crud'
	import Card from '$lib/components/ui/Card.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	let showPrimaryPhoto = $state(true)
	let showImageUrl = $state(true)

	/** @type {{item: any, data: any, recipeFavourited?: (uid: string) => void, recipeRatingChanged?: (uid: string, rating: number) => void}}, */
	let { item, data, recipeFavourited, recipeRatingChanged } = $props()

	let logged = $derived(item.log?.length > 0)
	let favourite = $derived(item?.on_favorites)
	let details = $derived(
		[
			{ label: 'Prep', value: item.prep_time },
			{ label: 'Cook', value: item.cook_time },
			{ label: 'Servings', value: item.servings }
		].filter((detail) => detail.value)
	)

	// Reset image visibility when the recipe changes
	$effect(() => {
		const _primaryId = item.photos?.[0]?.id
		const _imageUrl = item.image_url
		showPrimaryPhoto = true
		showImageUrl = true
	})

	async function handleFavourite(uid, event) {
		event.preventDefault()
		event.stopPropagation()
		console.log('Handle favourite button clicked for uid: ' + uid)
		const success = await changeRecipeFavourite(uid)
		if (success && recipeFavourited) {
			recipeFavourited(uid)
		}
	}
</script>

<a
	href="/recipe/{item.uid}/view/"
	class="flex items-stretch gap-3 mb-3 rounded-lg transition no-underline text-current">
	<Card
		class="flex-1 hover:bg-base-200 min-h-24 md:min-h-36 [&_.card-body]:h-full [&_.card-body]:py-1 [&_.card-body]:justify-start [&_.card-body]:pt-1 md:[&_.card-body]:pt-[10px]"
		size="md"
		side
		figureClass="w-24 md:w-32 flex-shrink-0 self-stretch">
		{#snippet figure()}
			<div class="h-full min-h-24 md:min-h-36 w-full overflow-hidden">
				{#if item.photos && item.photos.length > 0 && showPrimaryPhoto}
					<img
						class="h-full w-full object-cover"
						loading="lazy"
						src="/api/recipe/image/{item.photos[0].id}"
						alt="{item.name} thumbnail"
						onerror={() => (showPrimaryPhoto = false)} />
				{:else if item.image_url && showImageUrl}
					<img
						class="h-full w-full object-cover"
						loading="lazy"
						src={item.image_url}
						alt="{item.name} thumbnail"
						onerror={() => (showImageUrl = false)} />
				{:else}
					<div class="h-full w-full bg-base-300" aria-hidden="true"></div>
				{/if}
			</div>
		{/snippet}

		{#snippet title()}
			<div class="flex items-start justify-between gap-2 w-full min-w-0">
				<span class="flex-1 min-w-0 text-base md:text-2xl leading-snug line-clamp-3 md:line-clamp-2">
					{item.name}
				</span>
				{#if item.userId === data.user?.requestedUserId}
					<div class="flex gap-2 shrink-0">
						<Button
							onclick={(event) => handleFavourite(item?.uid, event)}
							style="ghost"
							size="sm"
							class="btn-circle h-9 w-9 tooltip hover:opacity-100 {favourite ? 'text-error opacity-100' : ''}"
							data-tip="Favourite Recipe">
							<Favourite {favourite} width="22px" height="22px" />
						</Button>
						<Button
							style="ghost"
							size="sm"
							class="btn-circle h-9 w-9 tooltip hover:opacity-100 {logged ? 'text-success opacity-100' : ''}"
							data-tip={item.log?.length > 0
								? `Cooked ${item.log.length} time${item.log.length > 1 ? 's' : ''}`
								: 'Never cooked'}>
							<Check checked={logged} width="22px" height="22px" />
						</Button>
					</div>
				{/if}
			</div>
		{/snippet}

		{#snippet children()}
			<StarRating
				rating={item.rating}
				editable={true}
				ratingChanged={(newRating) => recipeRatingChanged?.(item.uid, newRating)} />
			{#if details.length}
				<div class="mt-5 max-md:mt-0 text-xs text-base-content/70 flex flex-wrap gap-x-3 gap-y-2">
					{#each details as detail (detail.label)}
						<span>{detail.label}: {detail.value}</span>
					{/each}
				</div>
			{/if}
		{/snippet}
	</Card>
</a>
