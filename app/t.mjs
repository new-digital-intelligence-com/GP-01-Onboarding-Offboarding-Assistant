const TAG_BOUNDARY = /(?<=\S)[ \t]*(?=(?:STEP|DONE|FAIL|STAGED|ASSUME|SUMMARY)\s)/g;
const s = "STEP Resolving context and verifying managerASSUME Manager verified: Helmi Lakhder\nSTEP Setting BambooHR job information and managerSTEP Setting employment status in BambooHRDONE BambooHR job info and employment status :: Marketing Analyst\nSUMMARY 8 verified, 1 staged, ref GP01-2026-08-27-01";
for (const l of s.replace(TAG_BOUNDARY, "\n").split("\n")) console.log(JSON.stringify(l));
