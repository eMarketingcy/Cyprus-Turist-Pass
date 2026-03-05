/**
 * Mock Car Rental API Service
 * 
 * Simulates enterprise APIs for Sixt, Hertz, GeoDrive, etc.
 * Approves any contract number starting with "TEST" and gives it a 7-day validity.
 */

export interface RentalValidationResult {
  isValid: boolean;
  error?: string;
  data?: {
    contractNumber: string;
    agencyName: string;
    startDate: string;
    endDate: string;
    vehicleClass?: string;
  };
}

export const validateRentalContract = async (
  contractNumber: string, 
  agencyName: string
): Promise<RentalValidationResult> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const normalizedContract = contractNumber.trim().toUpperCase();

  // MVP Logic: Approve if starts with "TEST"
  if (normalizedContract.startsWith("TEST")) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + 7); // 7-day validity

    return {
      isValid: true,
      data: {
        contractNumber: normalizedContract,
        agencyName: agencyName,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        vehicleClass: "Compact SUV" // Mock data
      }
    };
  }

  // Failure case
  return {
    isValid: false,
    error: `Contract ${contractNumber} not found in ${agencyName} database or has expired.`
  };
};
