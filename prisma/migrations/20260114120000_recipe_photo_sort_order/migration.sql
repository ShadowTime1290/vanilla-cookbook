-- Add sort order for recipe photos
ALTER TABLE "RecipePhoto" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
