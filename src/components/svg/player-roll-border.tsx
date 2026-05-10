import { ComponentProps } from "react";

export const PlayerRollBorder: React.FC<ComponentProps<"svg">> = ({
    color,
    ...props
}) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="111"
        height="114"
        fill="none"
        viewBox="0 0 111 114"
        {...props}
    >
        <path
            fill="url(#paint0_linear_817_309)"
            d="M56.5.5c-1.836 7.482-15.775 8.032-46 7.5-7.453.486-9.313 2.393-9.5 8v98h108.5V16c-.146-6.133-1.835-8.344-10.5-8-27.675.331-41.079-.104-42.5-7.5"
        ></path>
        <path
            stroke="url(#paint1_linear_817_309)"
            strokeWidth="2"
            d="M1 114V16c.187-5.607 2.047-7.514 9.5-8 30.225.532 44.164-.018 46-7.5C57.921 7.896 71.325 8.331 99 8c8.665-.344 10.354 1.867 10.5 8v98"
        ></path>
        <defs>
            <linearGradient
                id="paint0_linear_817_309"
                x1="55.25"
                x2="55.25"
                y1="0.5"
                y2="114"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopOpacity="0.8"></stop>
                <stop offset="0.52" stopOpacity="0.655"></stop>
                <stop offset="0.79" stopOpacity="0.325"></stop>
                <stop offset="1" stopOpacity="0"></stop>
            </linearGradient>
            <linearGradient
                id="paint1_linear_817_309"
                x1="55.25"
                x2="55.25"
                y1="0.5"
                y2="114"
                gradientUnits="userSpaceOnUse"
            >
                <stop stopColor={color}></stop>
                <stop offset="1" stopColor={color} stopOpacity="0"></stop>
            </linearGradient>
        </defs>
    </svg>
);
