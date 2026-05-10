import { ComponentProps } from "react";

export const DieIgnored: React.FC<ComponentProps<"svg">> = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="24"
        fill="none"
        viewBox="0 0 22 24"
        {...props}
    >
        <g filter="url(#filter0_d_835_82)">
            <path
                fill="url(#paint0_linear_835_82)"
                d="m11 0 6.928 4v8L11 16l-6.928-4V4z"
            ></path>
            <path
                stroke="#fff"
                d="M4.572 4.289 11 .577l6.428 3.712v7.422L11 15.423 4.572 11.71z"
            ></path>
        </g>
        <path fill="#D9D9D9" d="m11 4 3.464 6H7.536z"></path>
        <defs>
            <linearGradient
                id="paint0_linear_835_82"
                x1="5.667"
                x2="16"
                y1="0"
                y2="16"
                gradientUnits="userSpaceOnUse"
            >
                <stop offset="0.005" stopColor="#C0BCBC"></stop>
                <stop offset="0.515" stopColor="#646262"></stop>
            </linearGradient>
            <filter
                id="filter0_d_835_82"
                width="21.855"
                height="24"
                x="0.072"
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
                    result="effect1_dropShadow_835_82"
                ></feBlend>
                <feBlend
                    in="SourceGraphic"
                    in2="effect1_dropShadow_835_82"
                    result="shape"
                ></feBlend>
            </filter>
        </defs>
    </svg>
);
