import React from 'react';
import Svg, { G, Line, Path } from 'react-native-svg';

type IconlyIconProps = {
  size?: number;
  color?: string;
};

export const IconlyChart = ({
  size = 24,
  color = '#000000',
}: IconlyIconProps) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <G
        stroke="none"
        strokeWidth={1.5}
        fill="none"
        fillRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <G
          transform="translate(2, 2)"
          stroke={color}
          strokeWidth={1.5}
        >
          <Line
            x1="5.37142857"
            y1="8.20171265"
            x2="5.37142857"
            y2="15.0618459"
          />

          <Line
            x1="10.0380952"
            y1="4.91912464"
            x2="10.0380952"
            y2="15.0618459"
          />

          <Line
            x1="14.6285714"
            y1="11.8268316"
            x2="14.6285714"
            y2="15.0618459"
          />

          <Path d="M14.6857143,0 L5.31428571,0 C2.04761905,0 0,2.31208373 0,5.58515699 L0,14.414843 C0,17.6879163 2.03809524,20 5.31428571,20 L14.6857143,20 C17.9619048,20 20,17.6879163 20,14.414843 L20,5.58515699 C20,2.31208373 17.9619048,0 14.6857143,0 Z" />
        </G>
      </G>
    </Svg>
  );
};