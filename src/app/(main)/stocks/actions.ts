"use server";

import { getDb } from "@/lib/db";

// ---------- LOOKUPS ----------
export async function getLookups() {
  const pool = await getDb();
  const [categories, sizes, colors] = await Promise.all([
    pool.request().query("SELECT Id, Name FROM Categories ORDER BY Name"),
    pool.request().query("SELECT Id, Name FROM Sizes ORDER BY Name"),
    pool.request().query("SELECT Id, Name FROM Colors ORDER BY Name"),
  ]);
  return {
    categories: categories.recordset,
    sizes: sizes.recordset,
    colors: colors.recordset,
  };
}

// ---------- CATEGORY CRUD ----------
export async function addCategory(name: string) {
  const pool = await getDb();
  await pool.request().input("Name", name).query("INSERT INTO Categories (Name) VALUES (@Name)");
}
export async function updateCategory(id: string, name: string) {
  const pool = await getDb();
  await pool.request().input("Id", id).input("Name", name).query("UPDATE Categories SET Name=@Name WHERE Id=@Id");
}
export async function deleteCategory(id: string) {
  const pool = await getDb();
  await pool.request().input("Id", id).query("DELETE FROM Categories WHERE Id=@Id");
}

// ---------- SIZE CRUD ----------
export async function addSize(name: string) {
  const pool = await getDb();
  await pool.request().input("Name", name).query("INSERT INTO Sizes (Name) VALUES (@Name)");
}
export async function updateSize(id: string, name: string) {
  const pool = await getDb();
  await pool.request().input("Id", id).input("Name", name).query("UPDATE Sizes SET Name=@Name WHERE Id=@Id");
}
export async function deleteSize(id: string) {
  const pool = await getDb();
  await pool.request().input("Id", id).query("DELETE FROM Sizes WHERE Id=@Id");
}

// ---------- COLOR CRUD ----------
export async function addColor(name: string) {
  const pool = await getDb();
  await pool.request().input("Name", name).query("INSERT INTO Colors (Name) VALUES (@Name)");
}
export async function updateColor(id: string, name: string) {
  const pool = await getDb();
  await pool.request().input("Id", id).input("Name", name).query("UPDATE Colors SET Name=@Name WHERE Id=@Id");
}
export async function deleteColor(id: string) {
  const pool = await getDb();
  await pool.request().input("Id", id).query("DELETE FROM Colors WHERE Id=@Id");
}

// ---------- PRODUCT CRUD ----------
export async function getProductsByCategory(categoryId: string) {
  const pool = await getDb();
  const res = await pool
    .request()
    .input("CategoryId", categoryId)
    .query("SELECT Id, Name, SKU, CostPrice, SellingPrice FROM Products WHERE CategoryId=@CategoryId ORDER BY Name");
  return res.recordset;
}
export async function addProduct(categoryId: string, name: string, cost: number, sell: number) {
  const pool = await getDb();
  const sku = `${name.replace(/\s+/g, "-").toUpperCase()}-${Date.now()}`;
  await pool
    .request()
    .input("CategoryId", categoryId)
    .input("Name", name)
    .input("SKU", sku)
    .input("Cost", cost)
    .input("Sell", sell)
    .query("INSERT INTO Products (CategoryId, Name, SKU, CostPrice, SellingPrice) VALUES (@CategoryId,@Name,@SKU,@Cost,@Sell)");
}
export async function updateProduct(id: string, name: string, cost: number, sell: number) {
  const pool = await getDb();
  await pool
    .request()
    .input("Id", id)
    .input("Name", name)
    .input("Cost", cost)
    .input("Sell", sell)
    .query("UPDATE Products SET Name=@Name, CostPrice=@Cost, SellingPrice=@Sell WHERE Id=@Id");
}
export async function deleteProduct(id: string) {
  const pool = await getDb();
  await pool.request().input("Id", id).query("DELETE FROM Products WHERE Id=@Id");
}

// ---------- QUICK STOCK ----------
export async function quickStock(productId: string, sizeId: string, colorId: string, qty: number, price: number) {
  const pool = await getDb();

  const check = await pool
    .request()
    .input("ProductId", productId)
    .input("SizeId", sizeId)
    .input("ColorId", colorId)
    .query("SELECT TOP 1 Id FROM ProductVariants WHERE ProductId=@ProductId AND SizeId=@SizeId AND ColorId=@ColorId");

  let variantId = check.recordset[0]?.Id;
  if (!variantId) {
    const ins = await pool
      .request()
      .input("ProductId", productId)
      .input("SizeId", sizeId)
      .input("ColorId", colorId)
      .query(
        "INSERT INTO ProductVariants (ProductId, SizeId, ColorId, Qty) OUTPUT Inserted.Id VALUES (@ProductId,@SizeId,@ColorId,0)"
      );
    variantId = ins.recordset[0].Id;
  }

  await pool
    .request()
    .input("Id", variantId)
    .input("Qty", qty)
    .input("Price", price)
    .query(
      `UPDATE ProductVariants 
       SET Qty = Qty + @Qty, 
           SellingPrice = CASE WHEN @Price>0 THEN @Price ELSE SellingPrice END
       WHERE Id=@Id`
    );

  await pool
    .request()
    .input("VariantId", variantId)
    .input("Qty", qty)
    .input("Reason", qty > 0 ? "add" : "remove")
    .query("INSERT INTO StockHistory (VariantId, ChangeQty, Reason) VALUES (@VariantId,@Qty,@Reason)");
}
