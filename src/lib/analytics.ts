// Google Analytics helper functions

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void
    dataLayer: Record<string, unknown>[]
  }
}

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '', {
      page_path: url,
    })
  }
}

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track ecommerce events
export const trackPurchase = ({
  transactionId,
  value,
  currency = 'INR',
  items,
}: {
  transactionId: string
  value: number
  currency?: string
  items: Array<{
    id: string
    name: string
    category?: string
    quantity: number
    price: number
  }>
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items,
    })
  }
}

// Track product views
export const trackProductView = ({
  productId,
  productName,
  category,
  price,
}: {
  productId: string
  productName: string
  category?: string
  price?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      items: [
        {
          item_id: productId,
          item_name: productName,
          item_category: category,
          price: price,
        },
      ],
    })
  }
}

// Track add to cart
export const trackAddToCart = ({
  productId,
  productName,
  price,
  quantity,
}: {
  productId: string
  productName: string
  price: number
  quantity: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      items: [
        {
          item_id: productId,
          item_name: productName,
          price: price,
          quantity: quantity,
        },
      ],
    })
  }
}

// Track begin checkout
export const trackBeginCheckout = ({
  value,
  items,
}: {
  value: number
  items: Array<{
    id: string
    name: string
    price: number
    quantity: number
  }>
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      value: value,
      currency: 'INR',
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    })
  }
}

// Track contact form submission
export const trackContactFormSubmit = () => {
  event({
    action: 'submit_form',
    category: 'Contact',
    label: 'Contact Form Submission',
  })
}

// Track user signup
export const trackSignup = (method: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method,
    })
  }
}

// Track user login
export const trackLogin = (method: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'login', {
      method: method,
    })
  }
}
