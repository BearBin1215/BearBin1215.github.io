import React, { forwardRef } from 'react';

interface LoadingIconProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
}

const LoadingIcon = forwardRef<SVGSVGElement, LoadingIconProps>(({ color, ...props }, ref) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 100 100'
    preserveAspectRatio='xMidYMid'
    ref={ref}
    {...props}
  >
    <path
      d='M10 50A40 40 0 0 0 90 50A40 42 0 0 1 10 50'
      fill={color || '#1d0e0b'}
      stroke='none'
    >
      <animateTransform
        attributeName='transform'
        type='rotate'
        dur='1s'
        repeatCount='indefinite'
        keyTimes='0;1'
        values='0 50 51;360 50 51'
      />
    </path>
  </svg>
));

LoadingIcon.displayName = 'LoadingIcon';

export default LoadingIcon;
