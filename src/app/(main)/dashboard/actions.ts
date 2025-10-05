"use server";

import { getDb } from "@/lib/db";

export async function getDashboardStats() {
  const pool = await getDb();
  const result = await pool.request().query(`
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);

    SELECT
      (SELECT SUM(Qty) FROM ProductVariants) AS TotalStock,
      (SELECT ISNULL(SUM(S.Qty * S.SellingPrice),0) FROM Sales S WHERE CAST(S.SaleDate AS DATE)=@Today) AS TodaysSales,
      (SELECT ISNULL(SUM(S.Qty * S.SellingPrice),0) FROM Sales S WHERE S.SaleDate>=@MonthStart) AS ThisMonthSales,
      (SELECT ISNULL(SUM((S.Qty*S.SellingPrice)-(S.Qty*P.CostPrice)),0)
        FROM Sales S JOIN ProductVariants V ON S.VariantId=V.Id
        JOIN Products P ON V.ProductId=P.Id WHERE S.SaleDate>=@MonthStart) AS ThisMonthProfit,
      (SELECT ISNULL(SUM(S.Qty),0) FROM Sales S WHERE CAST(S.SaleDate AS DATE)=@Today) AS UnitsSoldToday,
      (SELECT ISNULL(SUM(S.Qty),0) FROM Sales S WHERE S.SaleDate>=@MonthStart) AS UnitsSoldMonth,
      (SELECT ISNULL(SUM(E.Amount),0) FROM Expenses E WHERE E.ExpenseDate>=@MonthStart) AS ExpensesMonth,
      (SELECT ISNULL(SUM((S.Qty*S.SellingPrice)-(S.Qty*P.CostPrice)),0)
         - ISNULL((SELECT SUM(E.Amount) FROM Expenses E WHERE E.ExpenseDate>=@MonthStart),0)
         FROM Sales S JOIN ProductVariants V ON S.VariantId=V.Id
         JOIN Products P ON V.ProductId=P.Id WHERE S.SaleDate>=@MonthStart) AS ThisMonthNet,
      (SELECT ISNULL(SUM(S.Qty*S.SellingPrice),0) FROM Sales S) AS AllTimeSales,
      (SELECT ISNULL(SUM((S.Qty*S.SellingPrice)-(S.Qty*P.CostPrice)),0)
         FROM Sales S JOIN ProductVariants V ON S.VariantId=V.Id
         JOIN Products P ON V.ProductId=P.Id) AS AllTimeProfit,
      (SELECT COUNT(*) FROM Products) AS Products,
      (SELECT COUNT(*) FROM ProductVariants) AS Variants,
      (SELECT COUNT(*) FROM ProductVariants WHERE Qty < 5) AS LowStock
  `);
  return result.recordset[0];
}

export async function getLowStockItems() {
  const pool = await getDb();
  const res = await pool.request().query(`
    SELECT 
      V.Id AS VariantId, 
      P.Name AS ProductName, 
      S.Name AS SizeName, 
      C.Name AS ColorName, 
      V.Qty 
    FROM ProductVariants V
    JOIN Products P ON V.ProductId = P.Id
    JOIN Sizes S ON V.SizeId = S.Id
    JOIN Colors C ON V.ColorId = C.Id
    WHERE V.Qty < 5
    ORDER BY V.Qty ASC
  `);
  return { lowStockItems: res.recordset };
}

export async function getChartData() {
  const pool = await getDb();

  // Monthly summary for last 6 months
  const monthly = await pool.request().query(`
    SELECT TOP 6
      FORMAT(S.SaleDate, 'MMM yyyy') AS month,
      SUM(S.Qty*S.SellingPrice) AS sales,
      SUM((S.Qty*S.SellingPrice)-(S.Qty*P.CostPrice)) AS profit
    FROM Sales S
    JOIN ProductVariants V ON S.VariantId = V.Id
    JOIN Products P ON V.ProductId = P.Id
    GROUP BY FORMAT(S.SaleDate, 'MMM yyyy')
    ORDER BY MIN(S.SaleDate)
  `);

  // Daily sales for last 14 days
  const daily = await pool.request().query(`
    SELECT TOP 14
      CONVERT(VARCHAR(10), CAST(S.SaleDate AS DATE), 120) AS date,
      SUM(S.Qty*S.SellingPrice) AS sales
    FROM Sales S
    GROUP BY CAST(S.SaleDate AS DATE)
    ORDER BY MIN(S.SaleDate)
  `);

  return { monthly: monthly.recordset, daily: daily.recordset };
}
