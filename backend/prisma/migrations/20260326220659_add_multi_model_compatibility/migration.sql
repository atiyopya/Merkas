/*
  Warnings:

  - You are about to drop the column `carModel` on the `Product` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_CarModelToProduct" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_CarModelToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "CarModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CarModelToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "code" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "buyPrice" REAL,
    "sellPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("brand", "buyPrice", "code", "createdAt", "id", "name", "sellPrice", "stock", "updatedAt") SELECT "brand", "buyPrice", "code", "createdAt", "id", "name", "sellPrice", "stock", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_CarModelToProduct_AB_unique" ON "_CarModelToProduct"("A", "B");

-- CreateIndex
CREATE INDEX "_CarModelToProduct_B_index" ON "_CarModelToProduct"("B");
