import * as CPUT from "./universities/CPUT.js";
import * as UJ from "./universities/UJ.js";
import * as CUT from "./universities/CUT.js";
import * as MUT from "./universities/MUT.js";
import * as NMU from "./universities/NMU.js";
import * as NWU from "./universities/NWU.js";
import * as RU from "./universities/RU.js";
import * as SMU from "./universities/SMU.js";
import * as SPU from "./universities/SPU.js";
import * as UCT from "./universities/UCT.js";
import * as SU from "./universities/SU.js";
import * as TUT from "./universities/TUT.js";
import * as UFH from "./universities/UFH.js";
import * as UFS from "./universities/UFS.js";
import * as UKZN from "./universities/UKZN.js";
import * as UL from "./universities/UL.js";
import * as UMP from "./universities/UMP.js";
import * as UNIVEN from "./universities/UNIVEN.js";
import * as UNIZULU from "./universities/UNIZULU.js";
import * as UNISA from "./universities/UNISA.js";
import * as UP from "./universities/UP.js";
import * as UWC from "./universities/UWC.js";
import * as VUT from "./universities/VUT.js";
import * as WITS from "./universities/WITS.js";
import * as WSU from "./universities/WSU.js";

export const universities = {
    [TUT.meta.code]: TUT,
    [WSU.meta.code]: WSU,
    [UJ.meta.code]: UJ,
    [SMU.meta.code]: SMU,
    [MUT.meta.code]: MUT,
    // [NMU.meta.code]: NMU,
    [UNISA.meta.code]: UNISA,
    [UNIZULU.meta.code]: UNIZULU,
    // [NWU.meta.code]: NWU,
    // [CPUT.meta.code]: CPUT,
    // [NMU.meta.code]: NMU,
    // [CUT.meta.code]: CUT,
    // [RU.meta.code]: RU,
    // [SPU.meta.code]: SPU,
    // [SU.meta.code]: SU,
    // [UFH.meta.code]: UFH,
    // [UFS.meta.code]: UFS,
    // [UKZN.meta.code]: UKZN,
    // [UKZN.meta.code]: UKZN,
    // [UL.meta.code]: UL,
    // [UMP.meta.code]: UMP,
    // [UNIVEN.meta.code]: UNIVEN,
    // [UP.meta.code]: UP,
    // [VUT.meta.code]: VUT,
    // [WITS.meta.code]: WITS,
    // [UWC.meta.code]: UWC,
    // [DUT.meta.code]: DUT,
    // [UCT.meta.code]: UCT,
};

export const universityList = Object.values(universities).map(
    (uni) => uni.meta
);

// Build the list dynamically from ALL imported universities (whether active or not)
const importedUniversities = [
    CPUT,
    UJ,
    CUT,
    MUT,
    NMU,
    NWU,
    RU,
    SMU,
    SPU,
    UCT,
    SU,
    TUT,
    UFH,
    UFS,
    UKZN,
    UL,
    UMP,
    UNIVEN,
    UNIZULU,
    UNISA,
    UP,
    UWC,
    VUT,
    WITS,
    WSU,
];

const allImportedUniversities = importedUniversities
    .filter((u) => u && u.meta && u.meta.code && u.meta.displayName)
    .map((u) => ({ code: u.meta.code, displayName: u.meta.displayName }));

// Get list of unavailable universities (all imported minus currently active)
export const getUnavailableUniversities = () => {
    const activeCodes = Object.keys(universities);
    return allImportedUniversities.filter(
        (uni) => !activeCodes.includes(uni.code)
    );
};
