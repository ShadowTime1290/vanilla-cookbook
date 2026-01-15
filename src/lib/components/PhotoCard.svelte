<script>
	import Button from '$lib/components/ui/Button.svelte'
	import DeleteIcon from '$lib/components/svg/Delete.svelte'
	import UpArrow from '$lib/components/svg/UpArrow.svelte'

	/** @type {{
		photo: any,
		index: number,
		photoSrc: string,
		isMain?: boolean,
		showCoverBadge?: boolean,
		showMainRing?: boolean,
		showSetMain?: boolean,
		coverBadgeText?: string,
		removeButtonSize?: string,
		removeButtonOffset?: string,
		removeButtonRadius?: string,
		hoverOutlineColor?: string,
		hoverOutlineWidth?: string,
		hoverOutlineOffset?: string,
		isDragging?: boolean,
		isDropTarget?: boolean,
		onDelete?: (photo: any) => void,
		onSetMain?: (photo: any) => void,
		onDragStart?: (event: DragEvent) => void,
		onDragOver?: (event: DragEvent) => void,
		onDragLeave?: () => void,
		onDrop?: (event: DragEvent) => void,
		onDragEnd?: () => void
	}} */
	let {
		photo,
		index,
		photoSrc,
		isMain = false,
		showCoverBadge = false,
		showMainRing = false,
		showSetMain = false,
		coverBadgeText = 'Cover',
		removeButtonSize = '2.2rem',
		removeButtonOffset = '-0.5rem',
		removeButtonRadius = '0.5rem',
		hoverOutlineColor = 'rgba(37, 99, 235, 0.45)',
		hoverOutlineWidth = '2px',
		hoverOutlineOffset = '2px',
		isDragging = false,
		isDropTarget = false,
		onDelete,
		onSetMain,
		onDragStart,
		onDragOver,
		onDragLeave,
		onDrop,
		onDragEnd
	} = $props()

	const styleVars = $derived(
		[
			`--photo-remove-size: ${removeButtonSize}`,
			`--photo-remove-offset: ${removeButtonOffset}`,
			`--photo-remove-radius: ${removeButtonRadius}`,
			`--photo-hover-outline-color: ${hoverOutlineColor}`,
			`--photo-hover-outline-width: ${hoverOutlineWidth}`,
			`--photo-hover-outline-offset: ${hoverOutlineOffset}`
		].join('; ')
	)
</script>

<div
	class="photo-card flex flex-col items-center gap-2"
	class:is-dragging={isDragging}
	class:is-drop-target={isDropTarget}
	style={styleVars}
	draggable="true"
	ondragstart={onDragStart}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
	ondragend={onDragEnd}>
	<div class="photo-preview">
		<img
			src={photoSrc}
			alt="Recipe photo"
			class="max-h-40 rounded-lg shadow-md {showMainRing && isMain ? 'ring-4 ring-primary' : ''}" />
		{#if showCoverBadge && index === 0}
			<span class="cover-badge">{coverBadgeText}</span>
		{/if}
		<Button
			type="button"
			size="sm"
			style="soft"
			color="secondary"
			class="photo-remove-btn"
			aria-label="Delete photo"
			onclick={() => onDelete?.(photo)}>
			<DeleteIcon width="18px" height="18px" fill="currentColor" />
		</Button>
	</div>
	<div class="flex gap-2">
		{#if showSetMain && !isMain}
			<div class="tooltip" data-tip="Promote to Main Photo">
				<Button
					size="sm"
					style="soft"
					color="secondary"
					type="button"
					onclick={() => onSetMain?.(photo)}>
					<UpArrow width="24px" height="24px" />
				</Button>
			</div>
		{/if}
	</div>
</div>

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

	.photo-preview {
		position: relative;
	}

	.photo-preview img {
		transition: outline-color 140ms ease;
		outline: var(--photo-hover-outline-width) solid transparent;
		outline-offset: var(--photo-hover-outline-offset);
	}

	.photo-preview:hover img {
		outline-color: var(--photo-hover-outline-color);
	}

	.photo-preview :global(.photo-remove-btn) {
		position: absolute;
		top: var(--photo-remove-offset);
		right: var(--photo-remove-offset);
		width: var(--photo-remove-size);
		height: var(--photo-remove-size);
		min-height: 0;
		padding: 0;
		border-radius: var(--photo-remove-radius);
		display: grid;
		place-items: center;
		z-index: 1;
		transform: scale(0.95);
		transition: transform 140ms ease;
	}

	.photo-preview:hover :global(.photo-remove-btn) {
		transform: scale(1.1);
	}

	.cover-badge {
		position: absolute;
		top: 0.35rem;
		left: 0.35rem;
		background: var(--pico-primary, #2563eb);
		color: #fff;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		pointer-events: none;
	}
</style>
