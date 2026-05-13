import { GroupRollOverlay } from "./components/roll-overlay/group-roll-overlay";
import { RollOverlay } from "./components/roll-overlay/roll-overlay";
import "./index.css";

export const App = () => {
    return (
        <div className="draw-steel-rolls-react tw">
            <RollOverlay />
            <GroupRollOverlay />
        </div>
    );
};
