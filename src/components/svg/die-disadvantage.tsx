import { ComponentProps } from "react";

export const DieDisadvantage: React.FC<ComponentProps<"svg">> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="32"
        fill="none"
        viewBox="0 0 30 32"
        {...props}
    >
        <g filter="url(#filter0_d_835_83)">
            <path
                fill="url(#paint0_linear_835_83)"
                d="m15 0 10.392 6v12L15 24 4.608 18V6z"
            ></path>
            <path
                stroke="#fff"
                d="M5.108 6.289 15 .577l9.892 5.712V17.71L15 23.423 5.108 17.71z"
            ></path>
        </g>
        <path fill="#D9D9D9" d="M9.805 9h10.392l-5.196 9z"></path>
        <defs>
            <linearGradient
                id="paint0_linear_835_83"
                x1="7"
                x2="22.5"
                y1="0"
                y2="24"
                gradientUnits="userSpaceOnUse"
            >
                <stop offset="0.005" stopColor="#DE4545"></stop>
                <stop offset="0.515" stopColor="#782626"></stop>
            </linearGradient>
            <filter
                id="filter0_d_835_83"
                width="28.785"
                height="32"
                x="0.607"
                y="0"
                colorInterpolationFilters="sRGB"
                filterUnits="userSpaceOnUse"
            >
                <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
                <feColorMatrix
                    in="SourceAlpha"
                    result="hardAlpha"
                    values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                ></feColorMatrix>
                <feOffset dy="4"></feOffset>
                <feGaussianBlur stdDeviation="2"></feGaussianBlur>
                <feComposite in2="hardAlpha" operator="out"></feComposite>
                <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"></feColorMatrix>
                <feBlend
                    in2="BackgroundImageFix"
                    result="effect1_dropShadow_835_83"
                ></feBlend>
                <feBlend
                    in="SourceGraphic"
                    in2="effect1_dropShadow_835_83"
                    result="shape"
                ></feBlend>
            </filter>
        </defs>
    </svg>
);
