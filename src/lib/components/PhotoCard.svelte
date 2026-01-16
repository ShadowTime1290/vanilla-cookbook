<script>
	import Button from '$lib/components/ui/Button.svelte'
	import Back from '$lib/components/svg/Back.svelte'
	import DeleteIcon from '$lib/components/svg/Delete.svelte'
	import UpArrow from '$lib/components/svg/UpArrow.svelte'

	/** @type {{
		photo: any,
		index: number,
		photoSrc: string,
		isMain?: boolean,
		showCoverBadge?: boolean,
		showIndexBadge?: boolean,
		showMainRing?: boolean,
		showSetMain?: boolean,
		showMoveControls?: boolean,
		disableMoveLeft?: boolean,
		disableMoveRight?: boolean,
		coverBadgeText?: string,
		removeButtonSize?: string,
		removeButtonOffset?: string,
		removeButtonRadius?: string,
		hoverOutlineColor?: string,
		hoverOutlineWidth?: string,
		hoverOutlineOffset?: string,
		canDrag?: boolean,
		isDragging?: boolean,
		isDropTarget?: boolean,
		onDelete?: (photo: any) => void,
		onSetMain?: (photo: any) => void,
		onMoveLeft?: (photo: any) => void,
		onMoveRight?: (photo: any) => void,
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
		showIndexBadge = false,
		showMainRing = false,
		showSetMain = false,
		showMoveControls = false,
		disableMoveLeft = false,
		disableMoveRight = false,
		coverBadgeText = 'Cover',
		removeButtonSize = '2.2rem',
		removeButtonOffset = '-0.5rem',
		removeButtonRadius = '0.5rem',
		hoverOutlineColor = 'rgba(37, 99, 235, 0.45)',
		hoverOutlineWidth = '2px',
		hoverOutlineOffset = '2px',
		canDrag = true,
		isDragging = false,
		isDropTarget = false,
		onDelete,
		onSetMain,
		onMoveLeft,
		onMoveRight,
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
	draggable={canDrag}
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
		{#if showIndexBadge && index > 0}
			<span class="index-badge">{index}</span>
		{/if}
		{#if showMoveControls}
			<Button
				type="button"
				size="sm"
				style="soft"
				color="secondary"
				class="photo-move-btn photo-move-left"
				aria-label="Move photo left"
				disabled={disableMoveLeft}
				onclick={() => onMoveLeft?.(photo)}>
				<Back width="18px" height="18px" />
			</Button>
			<Button
				type="button"
				size="sm"
				style="soft"
				color="secondary"
				class="photo-move-btn photo-move-right"
				aria-label="Move photo right"
				disabled={disableMoveRight}
				onclick={() => onMoveRight?.(photo)}>
				<Back width="18px" height="18px" />
			</Button>
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
		width: 10rem;
		display: block;
		overflow: hidden;
	}

	.photo-preview::before {
		content: '';
		display: block;
		padding-top: 100%;
	}

	.photo-preview img {
		position: absolute;
		inset: 0;
		z-index: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
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

	.photo-preview :global(.photo-move-btn) {
		position: absolute;
		top: 50%;
		width: 2rem;
		height: 2rem;
		min-height: 0;
		padding: 0;
		border-radius: 999px;
		display: none;
		place-items: center;
		z-index: 2;
		transform: translateY(-50%);
	}

	.photo-preview :global(.photo-move-left) {
		left: 0.35rem;
	}

	.photo-preview :global(.photo-move-right) {
		right: 0.35rem;
	}

	.photo-preview :global(.photo-move-right svg) {
		transform: rotate(180deg);
	}

	.cover-badge {
		position: absolute;
		top: 0.35rem;
		left: 0.35rem;
		z-index: 2;
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

	.index-badge {
		position: absolute;
		top: 0.35rem;
		left: 0.35rem;
		z-index: 2;
		background: var(--pico-secondary, #334155);
		color: #fff;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		padding: 0.2rem 0.5rem;
		border-radius: 999px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
		pointer-events: none;
	}


	@media (max-width: 640px) {
		.photo-preview :global(.photo-move-btn) {
			display: grid;
		}

		.photo-card {
			width: 100%;
			align-items: center;
		}

		.photo-preview {
			width: 100%;
			margin-inline: auto;
		}

		.photo-preview img {
			max-height: none;
		}
	}
</style>
