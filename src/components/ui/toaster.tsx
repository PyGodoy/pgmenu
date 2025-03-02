import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            style={{ 
              backgroundColor: 'var(--background)', 
              color: 'var(--text)' 
            }}
          >
            <div className="grid gap-1">
              {title && <ToastTitle style={{ color: 'var(--primary)' }}>{title}</ToastTitle>}
              {description && (
                <ToastDescription style={{ color: 'var(--text)' }}>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose style={{ color: 'var(--primary)' }} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}