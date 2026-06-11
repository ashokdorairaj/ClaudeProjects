// Product conversion metrics utility

interface ProductEvent {
  productId: string
  views: number
  checkouts: number
  purchases: number
}

function conversionRate(views: number, checkouts: number): number {
  if (views === 0) return 0
  return (checkouts / views) * 100
}

function analyzeProduct(event: ProductEvent) {
  const viewToCheckout = conversionRate(event.views, event.checkouts)
  const checkoutToPurchase = conversionRate(event.checkouts, event.purchases)

  return {
    productId: event.productId,
    viewToCheckoutRate: viewToCheckout.toFixed(2),
    checkoutToPurchaseRate: checkoutToPurchase.toFixed(2),
    overallConversion: conversionRate(event.views, event.purchases).toFixed(2)
  }
}

function summarizeProducts(events: ProductEvent[]) {
  const results = events.map(analyzeProduct)

  const avgOverall = results.reduce((sum, r) => {
    return sum + parseFloat(r.overallConversion)
  }, 0) / results.length

  return {
    products: results,
    averageOverallConversion: avgOverall.toFixed(2),
    topProduct: results.reduce((best, r) =>
      parseFloat(r.overallConversion) > parseFloat(best.overallConversion) ? r : best
    )
  }
}

export type { ProductEvent }
export { conversionRate, analyzeProduct, summarizeProducts }
