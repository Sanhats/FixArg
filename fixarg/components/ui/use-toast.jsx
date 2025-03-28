"use client"

import * as React from "react"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

const TOAST_REMOVE_DELAY = 1000000

export function ToastDemo() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}

export function useToast() {
  const [toasts, setToasts] = React.useState([])

  function toast({ ...props }) {
    const id = Math.random().toString(36).substring(2, 9)
    const update = (props) =>
      setToasts((toasts) => toasts.map((t) => (t.id === id ? { ...t, ...props } : t)))
    const dismiss = () => setToasts((toasts) => toasts.filter((t) => t.id !== id))

    setToasts((toasts) => [
      {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
          if (!open) dismiss()
        },
      },
      ...toasts,
    ])

    return {
      id: id,
      dismiss,
      update,
    }
  }

  return {
    toast,
    toasts,
    dismiss: (toastId) => setToasts((toasts) => toasts.filter((t) => t.id !== toastId)),
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}