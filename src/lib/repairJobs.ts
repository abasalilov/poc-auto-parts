/**
 * Part types replaced together on a typical repair, most related first. A part type's related
 * types are everything in every job that lists it, so a job only lists parts that job needs.
 * Titles match `category_2.title` with HTML entities decoded; the catalog stores `&` both raw
 * and as `&amp;`.
 */
export const REPAIR_JOBS: string[][] = [
  // Disc brakes
  [
    "Brake Pad",
    "Rotor",
    "Caliper",
    "Disc Brake Hardware Kit",
    "Brake Pad Wear Sensor",
    "Caliper Guide Pin Boot Kit",
    "Brake Pad Shim Kit",
    "Caliper Bracket",
    "Hydraulic Hose",
    "Brake Fluid",
    "Rotor & Brake Pad Kit",
    "Caliper, Rotor & Brake Pad Kit",
  ],
  // Drum brakes
  [
    "Brake Shoe",
    "Drum",
    "Wheel Cylinder",
    "Drum Brake Hardware Kit",
    "Brake Shoe Adjuster",
    "Drum & Shoe Kit",
    "Parking Brake Cable",
    "Brake Fluid",
  ],
  // Brake hydraulics
  ["Master Cylinder", "Power Brake Booster", "Hydraulic Hose", "Caliper", "Wheel Cylinder", "Brake Fluid"],
  // Wheel bearings
  [
    "Wheel Bearing & Hub Assembly",
    "Wheel Bearing & Hub",
    "Wheel Bearing",
    "Wheel Hub",
    "Wheel Seal",
    "ABS Wheel Speed Sensor",
    "Spindle Nut",
    "Axle Hub Mounting Bolt",
  ],
  // Struts and shocks
  [
    "Strut",
    "Strut / Coil Spring / Mount Assembly",
    "Strut Mount",
    "Strut & Mount Kit",
    "Shock Absorber",
    "Coil Spring",
    "Strut Bearing",
    "Bump Stop",
    "Stabilizer Bar Link",
  ],
  // Front end and steering linkage
  [
    "Control Arm",
    "Ball Joint",
    "Tie Rod End",
    "Tie Rod Assembly (inner & outer)",
    "Stabilizer Bar Link",
    "Stabilizer Bar Bushing",
    "Control Arm Bushing",
    "Idler Arm",
    "Pitman Arm",
  ],
  // Axles and driveshafts
  ["CV Axle", "CV Joint Boot", "Axle Shaft Seal", "Spindle Nut", "Wheel Bearing & Hub Assembly"],
  ["Drive Shaft", "Universal Joint", "Differential Pinion Seal"],
  // Oil change and filters
  ["Oil Filter", "Motor Oil", "Oil Drain Plug", "Oil Drain Plug Gasket", "Air Filter", "Cabin Air Filter"],
  // Tune-up
  [
    "Spark Plug",
    "Ignition Coil",
    "Spark Plug Wire Set",
    "Spark Plug / Coil-On-Plug Boot",
    "Distributor Cap",
    "Distributor Rotor",
    "Air Filter",
    "Fuel Filter",
  ],
  ["Crankshaft Position Sensor", "Camshaft Position Sensor", "Ignition Coil", "Spark Plug"],
  // Timing belt or chain
  [
    "Timing Belt",
    "Timing Belt Kit",
    "Timing Belt Kit With Water Pump",
    "Timing Belt Tensioner",
    "Timing Belt Pulley",
    "Water Pump",
    "Camshaft Seal",
    "Crankshaft Seal",
  ],
  [
    "Timing Chain",
    "Timing Chain Tensioner",
    "Timing Chain Guide",
    "Timing Cover Gasket",
    "Crankshaft Seal",
    "Water Pump",
  ],
  // Accessory belt
  ["Belt", "Belt Tensioner", "Idler Pulley", "Tensioner Pulley", "Alternator / Generator"],
  // Cooling system
  [
    "Water Pump",
    "Thermostat",
    "Radiator",
    "Radiator Upper Hose",
    "Radiator Lower Hose",
    "Radiator Cap",
    "Water Pump Gasket",
    "Thermostat Housing / Water Outlet",
    "Coolant Reservoir",
    "Radiator Fan Assembly",
    "Coolant / Antifreeze",
  ],
  // Charging and starting
  ["Alternator / Generator", "Starter Motor", "Belt", "Battery Terminal", "Battery Cable"],
  // Fuel delivery
  [
    "Fuel Pump",
    "Fuel Pump & Housing Assembly",
    "Fuel Pump Strainer",
    "Fuel Filter",
    "Fuel Injector",
    "Fuel Injector Seal / O-Ring",
    "Fuel Pressure Sensor",
  ],
  // Air intake
  ["Air Filter", "Mass Air Flow Sensor", "Throttle Body", "Throttle Body Gasket", "Cabin Air Filter"],
  // Exhaust and emissions
  [
    "Oxygen (O2) Sensor",
    "Catalytic Converter",
    "Exhaust Manifold Gasket",
    "Exhaust Manifold",
    "Muffler",
    "EGR Valve",
    "EGR Gasket",
  ],
  // Engine gaskets
  ["Valve Cover Gasket", "Spark Plug Tube Seal", "Valve Cover Grommet", "Intake Manifold Gasket", "Spark Plug"],
  ["Motor Mount", "Transmission Mount"],
  // A/C and heat
  [
    "A/C Compressor",
    "A/C Compressor & Component Kit",
    "A/C Condenser",
    "A/C Receiver Drier / Accumulator",
    "A/C Accumulator & Orifice Tube Kit",
    "A/C Expansion Valve",
    "A/C Evaporator Core",
    "Cabin Air Filter",
  ],
  ["Heater Core", "Blower Motor", "Blower Motor Control Module / Resistor", "Cabin Air Filter"],
  // Wipers
  [
    "Wiper Blade",
    "Wiper Blade Refill",
    "Wiper Arm",
    "Wiper Motor",
    "Windshield Washer Pump",
    "Windshield Washer Nozzle",
  ],
  // Lighting
  [
    "Headlamp Bulb",
    "Headlamp Assembly",
    "Fog / Driving Light Bulb",
    "Parking Lamp Bulb",
    "Turn Signal Lamp Bulb",
    "Tail Lamp Bulb",
    "Brake Light Bulb",
    "License Plate Lamp Bulb",
    "Tail Lamp Assembly",
  ],
  // Clutch
  ["Clutch Kit", "Flywheel", "Clutch Master Cylinder", "Clutch Slave Cylinder", "Clutch Release Bearing"],
  // Wheels and tires
  [
    "Tire Pressure Monitoring System (TPMS) Sensor",
    "Tire Pressure Monitoring System (TPMS) Service Kit",
    "Lug Nut",
    "Lug Stud",
    "Wheel Lock Kit",
  ],
];

const key = (title: string) => title.trim().toLowerCase();

/** Part types for the same job as `title`, most related first; empty when no job lists it. */
export const relatedPartTypes = (title: string): string[] => {
  const own = key(title);
  const seen = new Set([own]);
  const related: string[] = [];
  REPAIR_JOBS.filter((job) => job.some((type) => key(type) === own)).forEach((job) => {
    job.forEach((type) => {
      if (seen.has(key(type))) return;
      seen.add(key(type));
      related.push(type);
    });
  });
  return related;
};

/** Both spellings the catalog stores a decoded title under. */
export const storedTitles = (titles: string[]) =>
  Array.from(new Set(titles.flatMap((title) => [title, title.replace(/&/g, "&amp;")])));
