declare module '@/components/ui/*' {
  import { ComponentType, HTMLAttributes } from 'react';
  const component: ComponentType<HTMLAttributes<any>>;
  export default component;
} 