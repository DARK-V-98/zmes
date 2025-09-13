
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Logo = ({ size = 'md', className }: LogoProps) => {
  const sizeMap = {
    sm: 25,
    md: 40,
    lg: 60,
    xl: 120,
  };
  const imageSize = sizeMap[size];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center bg-background rounded-full overflow-hidden',
        `w-[${imageSize}px] h-[${imageSize}px]`,
        className
      )}
      style={{ width: imageSize, height: imageSize }}
    >
      <Image
        src="/zm.png"
        alt="Z Messenger Logo"
        width={imageSize * 0.8}
        height={imageSize * 0.8}
        className="object-contain"
      />
    </div>
  );
};
