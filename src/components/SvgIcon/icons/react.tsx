import React, { SVGProps } from 'react';

const ReactIcon: React.FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox='-10.5 -9.45 21 18.9'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    color='#087ea4'
    {...props}
  >
    <circle
      cx='0'
      cy='0'
      r='2'
      fill='currentColor'
    />
    <g
      stroke='currentColor'
      strokeWidth='1'
      fill='none'
    >
      <ellipse
        rx='10'
        ry='4.5'
      />
      <ellipse
        rx='10'
        ry='4.5'
        transform='rotate(60)'
      />
      <ellipse
        rx='10'
        ry='4.5'
        transform='rotate(120)'
      />
    </g>
  </svg>
);

export default ReactIcon;
