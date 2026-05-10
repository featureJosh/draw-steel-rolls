import { ComponentProps, FC, useEffect, useRef, useState } from "react";

interface LazySvgProps extends ComponentProps<"svg"> {
    name: string;
}

const useLazySvgImport = (name: string) => {
    const importRef = useRef<FC<ComponentProps<"svg">>>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error>();

    useEffect(() => {
        setLoading(true);
        const importIcon = async () => {
            try {
                const module = await import(
                    `/modules/aeris-bg3-rolls/assets/${name}.svg`
                );
                importRef.current = module.default;
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        };
        importIcon();
    }, [name]);

    return {
        error,
        loading,
        Svg: importRef.current,
    };
};

export const LazySvg = ({ name, ...props }: LazySvgProps) => {
    const { loading, error, Svg } = useLazySvgImport(name);

    if (error) {
        return <div></div>;
    }

    if (loading) {
        return <div></div>;
    }

    if (!Svg) {
        return null;
    }

    return <Svg {...props} />;
};
