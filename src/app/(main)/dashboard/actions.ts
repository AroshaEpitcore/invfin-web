"use server";

import { getDb } from "@/lib/db";

export async function getDashboardStats() {
  const pool = await getDb();
  const result = await pool.request().query(`
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);

    SELECT
      -- Stock
      (SELECT SUM(Qty) FROM ProductVariants) AS TotalStock,

      -- Today Sales
      (SELECT ISNULL(SUM(S.Qty * S.SellingPrice),0) 
       FROM Sales S WHERE CAST(S.SaleDate AS DATE) = @Today) AS TodaysSales,

      -- This Month Sales
      (SELECT ISNULL(SUM(S.Qty * S.SellingPrice),0) 
       FROM Sales S WHERE S.SaleDate >= @MonthStart) AS ThisMonthSales,

      -- This Month Profit (Gross)
      (SELECT ISNULL(SUM((S.Qty * S.SellingPrice) - (S.Qty * P.CostPrice)),0)
       FROM Sales S 
       JOIN ProductVariants V ON S.VariantId = V.Id
       JOIN Products P ON V.ProductId = P.Id
       WHERE S.SaleDate >= @MonthStart) AS ThisMonthProfit,

      -- Units Sold Today
      (SELECT ISNULL(SUM(S.Qty),0) 
       FROM Sales S WHERE CAST(S.SaleDate AS DATE) = @Today) AS UnitsSoldToday,

      -- Units Sold This Month
      (SELECT ISNULL(SUM(S.Qty),0) 
       FROM Sales S WHERE S.SaleDate >= @MonthStart) AS UnitsSoldMonth,

      -- Expenses This Month
      (SELECT ISNULL(SUM(E.Amount),0) 
       FROM Expenses E WHERE E.ExpenseDate >= @MonthStart) AS ExpensesMonth,

      -- This Month Net (Gross − Expenses)
      (SELECT 
         ISNULL(SUM((S.Qty * S.SellingPrice) - (S.Qty * P.CostPrice)),0)
         - ISNULL((SELECT SUM(E.Amount) FROM Expenses E WHERE E.ExpenseDate >= @MonthStart),0)
       FROM Sales S 
       JOIN ProductVariants V ON S.VariantId = V.Id
       JOIN Products P ON V.ProductId = P.Id
       WHERE S.SaleDate >= @MonthStart) AS ThisMonthNet,

      -- All-time Sales
      (SELECT ISNULL(SUM(S.Qty * S.SellingPrice),0) FROM Sales S) AS AllTimeSales,

      -- All-time Profit (Gross)
      (SELECT ISNULL(SUM((S.Qty * S.SellingPrice) - (S.Qty * P.CostPrice)),0)
       FROM Sales S
       JOIN ProductVariants V ON S.VariantId = V.Id
       JOIN Products P ON V.ProductId = P.Id) AS AllTimeProfit,

      -- Products
      (SELECT COUNT(*) FROM Products) AS Products,

      -- Variants
      (SELECT COUNT(*) FROM ProductVariants) AS Variants,

      -- Low-stock Items (below 5)
      (SELECT COUNT(*) FROM ProductVariants WHERE Qty < 5) AS LowStock
  `);

  return result.recordset[0];
}
