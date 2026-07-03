import React, { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  FileText, 
  FileBadge, 
  ChevronLeft, 
  Info, 
  BookOpen, 
  Fingerprint, 
  Settings, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Database, 
  Code, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Check,
  Building,
  Download
} from "lucide-react";

interface PayrollModuleProps {
  isDarkMode: boolean;
  showNotification: (text: string, type?: "success" | "error" | "info") => void;
}

// Enums matching DB specifications
enum ShiftType {
  FIXED = "FIXED",
  ROTATIONAL = "ROTATIONAL",
  FLOATING = "FLOATING"
}

enum LogType {
  IN = "IN",
  OUT = "OUT",
  UNKNOWN = "UNKNOWN"
}

enum LeaveType {
  NONE = "NONE",
  EARNED = "EARNED",
  SICK = "SICK",
  UNPAID = "UNPAID"
}

enum MissionType {
  NONE = "NONE",
  HOURLY = "HOURLY",
  DAILY = "DAILY"
}

enum SheetStatus {
  DRAFT = "DRAFT",
  APPROVED_BY_MANAGER = "APPROVED_BY_MANAGER",
  FINALIZED = "FINALIZED",
  INCOMPLETE_LOG = "INCOMPLETE_LOG"
}

enum PayrollSlipStatus {
  DRAFT = "DRAFT",
  CALCULATED = "CALCULATED",
  APPROVED = "APPROVED"
}

enum SlipLineItemType {
  EARNING = "EARNING",
  DEDUCTION = "DEDUCTION"
}

// Database Interfaces
interface WorkShift {
  id: number;
  shift_name: string;
  type: ShiftType;
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  break_duration_minutes: number;
  allowed_delay_minutes: number;
  status: "ACTIVE" | "INACTIVE";
}

interface AttendanceRawLog {
  id: number;
  employee_id: number;
  log_timestamp: string; // YYYY-MM-DD HH:MM:SS
  device_id: string;
  log_type: LogType;
}

interface AttendanceDailySheet {
  id: number;
  employee_id: number;
  date: string; // YYYY-MM-DD
  shift_id: number | null;
  first_in: string | null;
  last_out: string | null;
  regular_work_minutes: number;
  overtime_minutes: number;
  night_work_minutes: number;
  delay_minutes: number;
  early_leave_minutes: number;
  absence_minutes: number;
  leave_type: LeaveType;
  leave_minutes: number;
  mission_type: MissionType;
  mission_minutes: number;
  status: SheetStatus;
  warning_message?: string;
}

interface Employee {
  id: number;
  name: string;
  role: string;
  national_id: string;
  base_shift_id: number;
  base_salary: number; // in Rials
}

interface PayrollPeriod {
  id: number;
  title: string;
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  is_locked: boolean;
  locked_at: string | null;
}

interface SalaryStructure {
  id: number;
  employee_id: number;
  base_salary: number; // حقوق پایه
  housing_allowance: number; // حق مسکن
  grocery_allowance: number; // بن و خواربار
  child_allowance_per_child: number; // حق اولاد برای هر فرزند
  number_of_children: number;
}

interface TaxBracket {
  id: number;
  year: number;
  threshold_from: number;
  threshold_to: number | null;
  tax_rate_percentage: number;
}

interface PayrollSlip {
  id: number;
  period_id: number;
  employee_id: number;
  regular_days_worked: number;
  overtime_hours: number;
  gross_earnings: number;
  insurance_salary_base: number;
  employee_insurance_amount: number;
  employer_insurance_amount: number;
  tax_amount: number;
  total_deductions: number;
  net_salary_payable: number;
  status: PayrollSlipStatus;
}

interface PayrollSlipLine {
  id: number;
  payroll_slip_id: number;
  item_type: SlipLineItemType;
  item_name: string;
  amount: number;
  is_taxable: boolean;
  is_insurable: boolean;
}

export default function PayrollModule({ isDarkMode, showNotification }: PayrollModuleProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showFriendlyGuide, setShowFriendlyGuide] = useState(true);

  // Simulated Database State
  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1001, name: "علیرضا رضایی", role: "برنامه‌نویس ارشد", national_id: "0012345678", base_shift_id: 1, base_salary: 220000000 },
    { id: 1002, name: "مریم محسنی", role: "سرپرست انبار", national_id: "0023456789", base_shift_id: 1, base_salary: 180000000 },
    { id: 1003, name: "امیر کریمی", role: "اپراتور فنی (نوبت‌کاری)", national_id: "0034567890", base_shift_id: 2, base_salary: 160000000 },
    { id: 1004, name: "زهرا لطفی", role: "کارشناس خزانه‌داری", national_id: "0045678901", base_shift_id: 3, base_salary: 170000000 },
  ]);

  const [shifts, setShifts] = useState<WorkShift[]>([
    { id: 1, shift_name: "شیفت ثابت روزکار اداری", type: ShiftType.FIXED, start_time: "08:00", end_time: "17:00", break_duration_minutes: 60, allowed_delay_minutes: 15, status: "ACTIVE" },
    { id: 2, shift_name: "شیفت شب‌کار مداوم قانون کار", type: ShiftType.FIXED, start_time: "22:00", end_time: "06:00", break_duration_minutes: 45, allowed_delay_minutes: 10, status: "ACTIVE" },
    { id: 3, shift_name: "شیفت شناور منعطف", type: ShiftType.FLOATING, start_time: "07:30", end_time: "16:30", break_duration_minutes: 60, allowed_delay_minutes: 30, status: "ACTIVE" },
  ]);

  const [rawLogs, setRawLogs] = useState<AttendanceRawLog[]>([
    // Employee 1001 Day 1 (Complete)
    { id: 1, employee_id: 1001, log_timestamp: "2026-07-01 08:05:00", device_id: "DEV_01", log_type: LogType.IN },
    { id: 2, employee_id: 1001, log_timestamp: "2026-07-01 17:02:00", device_id: "DEV_01", log_type: LogType.OUT },
    // Employee 1001 Day 2 (Late entry, overtime)
    { id: 3, employee_id: 1001, log_timestamp: "2026-07-02 08:45:00", device_id: "DEV_01", log_type: LogType.IN },
    { id: 4, employee_id: 1001, log_timestamp: "2026-07-02 19:15:00", device_id: "DEV_01", log_type: LogType.OUT },
    
    // Employee 1002 Day 1 (Incomplete log - missing OUT)
    { id: 5, employee_id: 1002, log_timestamp: "2026-07-01 08:12:00", device_id: "DEV_02", log_type: LogType.IN },

    // Employee 1003 Day 1 (Continuous Night Shift - spans midnight)
    { id: 6, employee_id: 1003, log_timestamp: "2026-07-01 22:00:00", device_id: "DEV_01", log_type: LogType.IN },
    { id: 7, employee_id: 1003, log_timestamp: "2026-07-02 06:05:00", device_id: "DEV_01", log_type: LogType.OUT },
  ]);

  const [dailySheets, setDailySheets] = useState<AttendanceDailySheet[]>([
    {
      id: 1,
      employee_id: 1001,
      date: "2026-07-01",
      shift_id: 1,
      first_in: "08:05",
      last_out: "17:02",
      regular_work_minutes: 440,
      overtime_minutes: 37,
      night_work_minutes: 0,
      delay_minutes: 0, // within 15 minutes grace
      early_leave_minutes: 0,
      absence_minutes: 0,
      leave_type: LeaveType.NONE,
      leave_minutes: 0,
      mission_type: MissionType.NONE,
      mission_minutes: 0,
      status: SheetStatus.FINALIZED
    }
  ]);

  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([
    { id: 1, title: "تیر ۱۴۰۵", year: 1405, month: 4, start_date: "2026-06-22", end_date: "2026-07-22", is_locked: false, locked_at: null }
  ]);

  const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([
    { id: 1, employee_id: 1001, base_salary: 220000000, housing_allowance: 9000000, grocery_allowance: 14000000, child_allowance_per_child: 7166184, number_of_children: 1 },
    { id: 2, employee_id: 1002, base_salary: 180000000, housing_allowance: 9000000, grocery_allowance: 14000000, child_allowance_per_child: 7166184, number_of_children: 2 },
  ]);

  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([
    { id: 1, year: 1405, threshold_from: 0, threshold_to: 120000000, tax_rate_percentage: 0 },
    { id: 2, year: 1405, threshold_from: 120000001, threshold_to: 165000000, tax_rate_percentage: 10 },
    { id: 3, year: 1405, threshold_from: 165000001, threshold_to: 270000000, tax_rate_percentage: 15 },
    { id: 4, year: 1405, threshold_from: 270000001, threshold_to: 400000000, tax_rate_percentage: 20 },
    { id: 5, year: 1405, threshold_from: 400000001, threshold_to: null, tax_rate_percentage: 30 },
  ]);

  const [payrollSlips, setPayrollSlips] = useState<PayrollSlip[]>([]);
  const [payrollSlipLines, setPayrollSlipLines] = useState<PayrollSlipLine[]>([]);

  // UI state for tabs inside Attendance section
  const [attendanceTab, setAttendanceTab] = useState<"dashboard" | "shifts" | "logs" | "daily" | "monthly" | "technical">("dashboard");
  const [payslipTab, setPayslipTab] = useState<"dashboard" | "calculator" | "slips" | "vouchers">("dashboard");

  // State for forms
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(1001);
  const [selectedDate, setSelectedDate] = useState<string>("2026-07-01");
  const [logTime, setLogTime] = useState<string>("08:00");
  const [logDirection, setLogDirection] = useState<LogType>(LogType.IN);
  const [newShift, setNewShift] = useState<Omit<WorkShift, "id">>({
    shift_name: "",
    type: ShiftType.FIXED,
    start_time: "08:00",
    end_time: "17:00",
    break_duration_minutes: 60,
    allowed_delay_minutes: 15,
    status: "ACTIVE"
  });

  // Time Utility Parsers
  const parseTimeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 60 + m;
  };

  const formatMinutesToTime = (totalMins: number): string => {
    const h = Math.floor(totalMins / 60) % 24;
    const m = totalMins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // 1. Core Iranian Labor Law Attendance Matching Logic
  const processDailyAttendance = (empId: number, dateStr: string) => {
    try {
      // Find employee
      const employee = employees.find(e => e.id === empId);
      if (!employee) {
        showNotification("کارمند مورد نظر یافت نشد.", "error");
        return;
      }

      // Fetch logs for specific employee on dateStr (including next day morning for night shifts)
      // For general purposes, we look up logs recorded on dateStr
      const targetDayLogs = rawLogs.filter(log => {
        const logDate = log.log_timestamp.split(" ")[0];
        // If employee has a night shift, we might look for next day logs as well
        // For simplicity, we search logs on that day, and if night shift, we look for logs recorded up to 12 hours next day too
        return log.employee_id === empId && logDate === dateStr;
      });

      // Special check for night shift logs that might span overnight (e.g. IN at 22:00, OUT at 06:00 next day)
      const isNightShift = employee.base_shift_id === 2;
      let relevantLogs = [...targetDayLogs];

      if (isNightShift) {
        // Also look for logs on the next day morning (up to 12:00)
        const nextDayStr = new Date(new Date(dateStr).getTime() + 86400000).toISOString().split("T")[0];
        const nextDayLogs = rawLogs.filter(log => {
          const parts = log.log_timestamp.split(" ");
          const logDate = parts[0];
          const logTimeStr = parts[1];
          if (log.employee_id === empId && logDate === nextDayStr) {
            const mins = parseTimeToMinutes(logTimeStr.substring(0, 5));
            return mins <= 720; // up to 12:00 noon
          }
          return false;
        });
        relevantLogs = [...relevantLogs, ...nextDayLogs];
      }

      // Sort logs by chronological order
      relevantLogs.sort((a, b) => new Date(a.log_timestamp).getTime() - new Date(b.log_timestamp).getTime());

      // If no logs registered
      if (relevantLogs.length === 0) {
        // Create an absence record
        const absenceSheet: AttendanceDailySheet = {
          id: Date.now(),
          employee_id: empId,
          date: dateStr,
          shift_id: employee.base_shift_id,
          first_in: null,
          last_out: null,
          regular_work_minutes: 0,
          overtime_minutes: 0,
          night_work_minutes: 0,
          delay_minutes: 0,
          early_leave_minutes: 0,
          absence_minutes: 440, // standard work day
          leave_type: LeaveType.NONE,
          leave_minutes: 0,
          mission_type: MissionType.NONE,
          mission_minutes: 0,
          status: SheetStatus.DRAFT,
          warning_message: "فاقد تردد (غیبت سیستم)"
        };

        setDailySheets(prev => {
          const filtered = prev.filter(s => !(s.employee_id === empId && s.date === dateStr));
          return [...filtered, absenceSheet];
        });
        showNotification(`محاسبه روز ${dateStr} انجام شد: عدم حضور (غیبت ثبت شد)`, "info");
        return;
      }

      // Strict Rule (Missing Logs verification)
      const ins = relevantLogs.filter(l => l.log_type === LogType.IN);
      const outs = relevantLogs.filter(l => l.log_type === LogType.OUT);

      if (ins.length === 0 || outs.length === 0 || relevantLogs.length % 2 !== 0) {
        const incompleteSheet: AttendanceDailySheet = {
          id: Date.now(),
          employee_id: empId,
          date: dateStr,
          shift_id: employee.base_shift_id,
          first_in: ins[0] ? ins[0].log_timestamp.split(" ")[1].substring(0, 5) : null,
          last_out: outs[outs.length - 1] ? outs[outs.length - 1].log_timestamp.split(" ")[1].substring(0, 5) : null,
          regular_work_minutes: 0,
          overtime_minutes: 0,
          night_work_minutes: 0,
          delay_minutes: 0,
          early_leave_minutes: 0,
          absence_minutes: 0,
          leave_type: LeaveType.NONE,
          leave_minutes: 0,
          mission_type: MissionType.NONE,
          mission_minutes: 0,
          status: SheetStatus.INCOMPLETE_LOG,
          warning_message: `⚠️ هشدار تردد ناقص: ${ins.length} ورود و ${outs.length} خروج یافت شد. فرآیند هم‌ترازی متوقف گردید.`
        };

        setDailySheets(prev => {
          const filtered = prev.filter(s => !(s.employee_id === empId && s.date === dateStr));
          return [...filtered, incompleteSheet];
        });
        showNotification(`خطای تردد ناقص برای تاریخ ${dateStr} پرسنل ${employee.name}`, "error");
        return;
      }

      // Identify first in and last out
      const firstInStr = ins[0].log_timestamp.split(" ")[1].substring(0, 5);
      const lastOutStr = outs[outs.length - 1].log_timestamp.split(" ")[1].substring(0, 5);

      const firstInMins = parseTimeToMinutes(firstInStr);
      let lastOutMins = parseTimeToMinutes(lastOutStr);

      // Spans overnight calculation
      if (lastOutMins < firstInMins) {
        lastOutMins += 1440; // Spans midnight
      }

      // Fetch assigned shift details
      const shift = shifts.find(s => s.id === employee.base_shift_id) || shifts[0];
      const shiftStartMins = parseTimeToMinutes(shift.start_time);
      const shiftEndMins = parseTimeToMinutes(shift.end_time);

      // Allowed Delay & Early leave logic
      let delayMinutes = 0;
      let earlyLeaveMinutes = 0;

      // Only calculate delay if FIXED shift
      if (shift.type === ShiftType.FIXED) {
        const actualDelay = firstInMins - shiftStartMins;
        if (actualDelay > shift.allowed_delay_minutes) {
          delayMinutes = actualDelay; // Full delay applied
        }
        
        const actualEarlyLeave = shiftEndMins - (lastOutMins % 1440);
        if (actualEarlyLeave > 0 && lastOutMins < shiftEndMins) {
          earlyLeaveMinutes = actualEarlyLeave;
        }
      }

      // Iranian Labor Law working limits (440 minutes / 7.33 hours regular duty ceiling)
      const totalPresenceMinutes = lastOutMins - firstInMins;
      const presenceMinusBreak = Math.max(0, totalPresenceMinutes - shift.break_duration_minutes);

      const regularWorkMinutes = Math.min(440, presenceMinusBreak);
      const overtimeMinutes = presenceMinusBreak > 440 ? presenceMinusBreak - 440 : 0;

      // Iranian Labor Law Night Work Evaluator (Any working minutes between 22:00 and 06:00)
      let nightWorkMinutes = 0;
      for (let m = firstInMins; m < lastOutMins; m++) {
        const dailyMin = m % 1440;
        // 22:00 is 1320th minute. 06:00 is 360th minute.
        if (dailyMin >= 1320 || dailyMin < 360) {
          nightWorkMinutes++;
        }
      }

      // Save calculated sheet
      const computedSheet: AttendanceDailySheet = {
        id: Date.now(),
        employee_id: empId,
        date: dateStr,
        shift_id: shift.id,
        first_in: firstInStr,
        last_out: lastOutStr,
        regular_work_minutes: regularWorkMinutes,
        overtime_minutes: overtimeMinutes,
        night_work_minutes: nightWorkMinutes,
        delay_minutes: delayMinutes,
        early_leave_minutes: earlyLeaveMinutes,
        absence_minutes: 0,
        leave_type: LeaveType.NONE,
        leave_minutes: 0,
        mission_type: MissionType.NONE,
        mission_minutes: 0,
        status: SheetStatus.APPROVED_BY_MANAGER
      };

      setDailySheets(prev => {
        const filtered = prev.filter(s => !(s.employee_id === empId && s.date === dateStr));
        return [...filtered, computedSheet];
      });

      showNotification(`محاسبه کارکرد روز ${dateStr} برای ${employee.name} با موفقیت انجام شد.`, "success");
    } catch (err: any) {
      showNotification(`خطا در موتور محاسباتی: ${err.message}`, "error");
    }
  };

  // Add dummy biometric logs
  const simulateBiometricLog = () => {
    const timestamp = `${selectedDate} ${logTime}:00`;
    const newId = rawLogs.length > 0 ? Math.max(...rawLogs.map(l => l.id)) + 1 : 1;
    
    const duplicate = rawLogs.find(l => l.employee_id === selectedEmployeeId && l.log_timestamp === timestamp);
    if (duplicate) {
      showNotification("این اثر انگشت یا تردد قبلاً در این لحظه ثبت شده است.", "error");
      return;
    }

    const log: AttendanceRawLog = {
      id: newId,
      employee_id: selectedEmployeeId,
      log_timestamp: timestamp,
      device_id: "BIOMETRIC_TERMINAL_X9",
      log_type: logDirection
    };

    setRawLogs(prev => [...prev, log]);
    showNotification(`اثر انگشت ثبت شد: پرسنل #${selectedEmployeeId} جهت ${logDirection === LogType.IN ? "ورود" : "خروج"} در ساعت ${logTime}`, "success");
  };

  // Monthly Aggregator Engine
  const generateMonthlyAttendanceSummary = (empId: number, year: number, month: number) => {
    // Filter finalized daily sheets for this employee
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
    const targetSheets = dailySheets.filter(s => s.employee_id === empId && s.date.startsWith(monthPrefix));

    const totalWorkingDays = targetSheets.filter(s => s.regular_work_minutes > 0).length;
    const totalRegularMinutes = targetSheets.reduce((sum, s) => sum + s.regular_work_minutes, 0);
    const totalOvertimeMinutes = targetSheets.reduce((sum, s) => sum + s.overtime_minutes, 0);
    const totalNightMinutes = targetSheets.reduce((sum, s) => sum + s.night_work_minutes, 0);
    const totalAbsenceDays = targetSheets.filter(s => s.absence_minutes > 0).length;
    const totalDelayMinutes = targetSheets.reduce((sum, s) => sum + s.delay_minutes, 0);

    // Rotational Shift Allowance (نوبت کاری) calculation:
    // Under Iranian Labor Law: If they have rotational sheets, apply shift allowance percentage
    const employee = employees.find(e => e.id === empId);
    let shiftAllowanceRate = 0;
    if (employee && employee.base_shift_id === 2) {
      shiftAllowanceRate = 22.5; // continuous night shifts/rotational overlap
    } else if (employee && employee.base_shift_id === 3) {
      shiftAllowanceRate = 10; // floating/rotational
    }

    const baseSalary = employee ? employee.base_salary : 0;
    const shiftAllowanceAmount = Math.round((baseSalary * shiftAllowanceRate) / 100);

    return {
      totalWorkingDays,
      totalRegularHours: (totalRegularMinutes / 60).toFixed(1),
      totalOvertimeHours: (totalOvertimeMinutes / 60).toFixed(1),
      totalNightHours: (totalNightMinutes / 60).toFixed(1),
      totalDelayHours: (totalDelayMinutes / 60).toFixed(1),
      totalAbsenceDays,
      shiftAllowanceRate,
      shiftAllowanceAmount
    };
  };

  // Process all logs for selected employee
  const autoReconcileAll = () => {
    // Collect all unique dates from raw logs of selected employee
    const uniqueDates = Array.from(new Set<string>(
      rawLogs
        .filter(l => l.employee_id === selectedEmployeeId)
        .map(l => l.log_timestamp.split(" ")[0])
    ));

    if (uniqueDates.length === 0) {
      showNotification("هیچ تردد ثبتی برای این پرسنل یافت نشد.", "info");
      return;
    }

    uniqueDates.forEach(d => {
      processDailyAttendance(selectedEmployeeId, d);
    });
    showNotification(`موتور تطبیق تردد بر روی ${uniqueDates.length} روز با موفقیت اجرا شد.`, "success");
  };

  // Add new shift
  const handleAddShift = () => {
    if (!newShift.shift_name) {
      showNotification("لطفاً نام شیفت را وارد کنید.", "error");
      return;
    }
    const nextId = shifts.length > 0 ? Math.max(...shifts.map(s => s.id)) + 1 : 1;
    setShifts(prev => [...prev, { ...newShift, id: nextId } as WorkShift]);
    setNewShift({
      shift_name: "",
      type: ShiftType.FIXED,
      start_time: "08:00",
      end_time: "17:00",
      break_duration_minutes: 60,
      allowed_delay_minutes: 15,
      status: "ACTIVE"
    });
    showNotification("شیفت کاری جدید با موفقیت ثبت شد.", "success");
  };

  // 2. Core Payroll Calculation Engine
  const calculateEmployeePayroll = (empId: number, periodId: number) => {
    try {
      const period = payrollPeriods.find(p => p.id === periodId);
      if (!period) throw new Error("دوره مالی یافت نشد.");

      const structure = salaryStructures.find(s => s.employee_id === empId);
      if (!structure) throw new Error("ساختار حقوق و دستمزد این کارمند تعریف نشده است.");

      const summary = generateMonthlyAttendanceSummary(empId, period.year, period.month);
      
      // Constants
      const DAILY_BASE = structure.base_salary / 30;
      const HOURLY_BASE = DAILY_BASE / 7.33; // 440 minutes / 60
      const OVERTIME_RATE = HOURLY_BASE * 1.4; // 40% premium
      const NIGHT_WORK_RATE = HOURLY_BASE * 1.35; // 35% premium

      // Earning Calculations
      // Pro-rate if days worked < 30. Using min to cap at 30
      const workingDaysForCalc = Math.min(summary.totalWorkingDays, 30);
      let calculatedBaseSalary = 0;
      let calculatedHousing = 0;
      let calculatedGrocery = 0;
      let calculatedChildAllowance = 0;

      if (workingDaysForCalc > 0) {
        calculatedBaseSalary = Math.round((structure.base_salary / 30) * workingDaysForCalc);
        calculatedHousing = Math.round((structure.housing_allowance / 30) * workingDaysForCalc);
        calculatedGrocery = Math.round((structure.grocery_allowance / 30) * workingDaysForCalc);
        calculatedChildAllowance = structure.child_allowance_per_child * structure.number_of_children; // Usually fixed per month
      }

      const overtimePay = Math.round(Number(summary.totalOvertimeHours) * OVERTIME_RATE);
      const nightPay = Math.round(Number(summary.totalNightHours) * NIGHT_WORK_RATE);
      const shiftAllowancePay = summary.shiftAllowanceAmount;

      const grossEarnings = calculatedBaseSalary + calculatedHousing + calculatedGrocery + calculatedChildAllowance + overtimePay + nightPay + shiftAllowancePay;

      // 3. Social Security Calculation (Insurance)
      // Insurable items usually include Base, Grocery, Overtime, Night Pay, Shift Allowance.
      // Housing and Child Allowance are sometimes exempt or have different rules, but typically housing is insurable now. Child allowance is exempt.
      const insurableGross = calculatedBaseSalary + calculatedHousing + calculatedGrocery + overtimePay + nightPay + shiftAllowancePay;
      
      // Ceiling check (7 times the daily minimum wage * days). For simplicity, let's assume a fixed ceiling limit
      const DAILY_MINIMUM_WAGE = 2388728; // Rial (Year 1403/1404 roughly, just for demo)
      const MONTHLY_CEILING = DAILY_MINIMUM_WAGE * 7 * 30; // ~ 501,632,880 Rials
      const insuranceBase = Math.min(insurableGross, MONTHLY_CEILING);

      const employeeInsuranceAmount = Math.round(insuranceBase * 0.07);
      const employerInsuranceAmount = Math.round(insuranceBase * 0.23);

      // 4. Progressive Tax Calculation
      // Taxable items generally include Base, Housing, Grocery, Overtime, Night, Shift.
      // Often, a portion of some allowances might be exempt, but we use the total here as taxable gross
      const taxableGross = grossEarnings - employeeInsuranceAmount; // In Iran, 7% insurance is deducted before tax calculation
      
      let taxAmount = 0;
      let remainingTaxable = taxableGross;

      // Ensure tax brackets are sorted
      const sortedBrackets = [...taxBrackets].sort((a, b) => a.threshold_from - b.threshold_from);

      for (const bracket of sortedBrackets) {
        if (remainingTaxable <= 0) break;
        
        const bracketRange = bracket.threshold_to ? (bracket.threshold_to - bracket.threshold_from + 1) : Infinity;
        const amountInBracket = Math.min(remainingTaxable, bracketRange);
        
        taxAmount += (amountInBracket * bracket.tax_rate_percentage) / 100;
        
        if (taxableGross <= (bracket.threshold_to || Infinity)) {
          break; // We've covered the whole taxable amount
        }
      }
      taxAmount = Math.round(taxAmount);

      // 5. Total Deductions
      const totalDeductions = employeeInsuranceAmount + taxAmount; // add loans, advances here if needed

      // 6. Net Payable
      const netPayable = grossEarnings - totalDeductions;

      // Construct Slip Lines
      const slipLines: Omit<PayrollSlipLine, "id" | "payroll_slip_id">[] = [
        { item_type: SlipLineItemType.EARNING, item_name: "حقوق پایه", amount: calculatedBaseSalary, is_taxable: true, is_insurable: true },
        { item_type: SlipLineItemType.EARNING, item_name: "حق مسکن", amount: calculatedHousing, is_taxable: true, is_insurable: true },
        { item_type: SlipLineItemType.EARNING, item_name: "بن و خواربار", amount: calculatedGrocery, is_taxable: true, is_insurable: true },
        { item_type: SlipLineItemType.EARNING, item_name: "حق اولاد", amount: calculatedChildAllowance, is_taxable: false, is_insurable: false },
        { item_type: SlipLineItemType.EARNING, item_name: "اضافه کاری", amount: overtimePay, is_taxable: true, is_insurable: true },
        { item_type: SlipLineItemType.EARNING, item_name: "شب کاری", amount: nightPay, is_taxable: true, is_insurable: true },
        { item_type: SlipLineItemType.EARNING, item_name: "نوبت کاری", amount: shiftAllowancePay, is_taxable: true, is_insurable: true },
        { item_type: SlipLineItemType.DEDUCTION, item_name: "بیمه تامین اجتماعی (سهم کارگر ۷٪)", amount: employeeInsuranceAmount, is_taxable: false, is_insurable: false },
        { item_type: SlipLineItemType.DEDUCTION, item_name: "مالیات بر درآمد حقوق", amount: taxAmount, is_taxable: false, is_insurable: false },
      ];

      // Insert or Update Slip
      setPayrollSlips(prev => {
        const existingSlip = prev.find(s => s.employee_id === empId && s.period_id === periodId);
        const newSlipId = existingSlip ? existingSlip.id : (prev.length > 0 ? Math.max(...prev.map(p => p.id)) + 1 : 1);
        
        const slip: PayrollSlip = {
          id: newSlipId,
          period_id: periodId,
          employee_id: empId,
          regular_days_worked: workingDaysForCalc,
          overtime_hours: Number(summary.totalOvertimeHours),
          gross_earnings: grossEarnings,
          insurance_salary_base: insuranceBase,
          employee_insurance_amount: employeeInsuranceAmount,
          employer_insurance_amount: employerInsuranceAmount,
          tax_amount: taxAmount,
          total_deductions: totalDeductions,
          net_salary_payable: netPayable,
          status: PayrollSlipStatus.CALCULATED
        };

        // Update Lines
        setPayrollSlipLines(prevLines => {
          const filtered = prevLines.filter(l => l.payroll_slip_id !== newSlipId);
          let nextLineId = filtered.length > 0 ? Math.max(...filtered.map(l => l.id)) + 1 : 1;
          const mappedLines = slipLines.filter(l => l.amount > 0).map(l => ({ ...l, id: nextLineId++, payroll_slip_id: newSlipId }));
          return [...filtered, ...mappedLines];
        });

        if (existingSlip) {
          return prev.map(s => s.id === newSlipId ? slip : s);
        }
        return [...prev, slip];
      });

      showNotification(`فیش حقوقی با موفقیت محاسبه گردید.`, "success");
    } catch (err: any) {
      showNotification(`خطا در موتور محاسبه حقوق: ${err.message}`, "error");
    }
  };

  const autoGenerateAllPayslips = (periodId: number) => {
    employees.forEach(emp => {
      calculateEmployeePayroll(emp.id, periodId);
    });
    showNotification("محاسبه گروهی فیش‌های حقوقی تکمیل شد.", "info");
  };

  // Legal Files state
  const [legalFilesTab, setLegalFilesTab] = useState<"dashboard" | "insurance" | "tax" | "bank">("dashboard");
  const [selectedBank, setSelectedBank] = useState<string>("MELLAT");

  // Regulatory Legal Files Factory (Simulated in TypeScript for Client-Side Generation)
  const generateSocialSecurityFiles = () => {
    try {
      // Validate Data
      if (payrollSlips.length === 0) throw new Error("هیچ فیش حقوقی در این دوره یافت نشد.");
      
      const missingIds = employees.filter(e => !e.national_id).length;
      if (missingIds > 0) throw new Error(`تعداد ${missingIds} کارمند کد ملی معتبر ندارند.`);

      // 1. DSKKAR00.DBF (Workshop Data) - Simulated CSV/TXT format
      let dskkar = "DSK_ID,DSK_NAME,DSK_FARM,DSK_ADRS,DSK_KIND,DSK_YY,DSK_MM,DSK_LISTNO,DSK_DISC,DSK_NUM,DSK_TDD,DSK_TROZ,DSK_TMAH,DSK_TMAZ,DSK_VAM,DSK_BIM,DSK_PRN\n";
      dskkar += `1111111111,شرکت نمونه,کارفرما,تهران,,1405,04,01,0,${payrollSlips.length},${payrollSlips.reduce((sum, s) => sum + s.regular_days_worked, 0)},${payrollSlips.reduce((sum, s) => sum + s.insurance_salary_base, 0)},0,0,0,${payrollSlips.reduce((sum, s) => sum + s.employee_insurance_amount + s.employer_insurance_amount, 0)},0\n`;
      
      // 2. DSKWOR00.DBF (Employee Data) - Simulated CSV/TXT format
      let dskwor = "DSW_ID,DSW_YY,DSW_MM,DSW_LISTNO,DSW_ID1,DSW_FNAME,DSW_LNAME,DSW_DNAME,DSW_IDNO,DSW_IDPLC,DSW_IDATE,DSW_BDATE,DSW_SEX,DSW_NAT,DSW_OCP,DSW_SDATE,DSW_EDATE,DSW_DD,DSW_ROZ,DSW_MAH,DSW_MAZ,DSW_MASH,DSW_TOTL,DSW_BIM,DSW_PRN,DSW_JOB\n";
      
      payrollSlips.forEach((slip, index) => {
        const emp = employees.find(e => e.id === slip.employee_id);
        if (emp) {
          dskwor += `1111111111,1405,04,01,${emp.national_id},${emp.name.split(' ')[0]},${emp.name.split(' ')[1] || ''},پدر,${emp.national_id},تهران,,,مرد,ایرانی,کارمند,,,${slip.regular_days_worked},${Math.round(slip.insurance_salary_base / slip.regular_days_worked)},${slip.insurance_salary_base},0,0,${slip.insurance_salary_base},${slip.employee_insurance_amount},0,12345\n`;
        }
      });

      downloadFile("DSKKAR00.txt", dskkar);
      downloadFile("DSKWOR00.txt", dskwor);
      
      showNotification("دیسکت بیمه تامین اجتماعی با موفقیت تولید شد. (نیازمند تبدیل به DBF با انکدینگ Windows-1256)", "success");
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const generateTaxFiles = () => {
    try {
      if (payrollSlips.length === 0) throw new Error("هیچ فیش حقوقی در این دوره یافت نشد.");
      
      // WP.txt (Workshop), WH.txt (Header), WK.txt (Employees)
      let wh = "WH,1405,04,111111111111,شرکت نمونه,تهران\n";
      let wk = "WK,1405,04,";
      
      payrollSlips.forEach((slip, index) => {
        const emp = employees.find(e => e.id === slip.employee_id);
        if (emp) {
          wk += `${emp.national_id},${emp.name},${slip.gross_earnings},${slip.tax_amount}\nWK,1405,04,`;
        }
      });
      
      downloadFile("WH.txt", wh);
      downloadFile("WK.txt", wk);
      showNotification("دیسکت مالیات حقوق با موفقیت تولید شد.", "success");
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const generateBankFile = () => {
    try {
      if (payrollSlips.length === 0) throw new Error("هیچ فیش حقوقی در این دوره یافت نشد.");
      
      let bankTxt = "";
      payrollSlips.forEach((slip, index) => {
        const emp = employees.find(e => e.id === slip.employee_id);
        if (emp) {
          // Format: Row Number, Account Number, Amount in Rials, 'Y', Employee Name
          const accNumber = "IR" + String(emp.national_id).padEnd(22, '0');
          if (selectedBank === "MELLAT") {
            bankTxt += `${index + 1},${accNumber},${slip.net_salary_payable},Y,${emp.name}\n`;
          } else if (selectedBank === "MELLI") {
            bankTxt += `${accNumber};${slip.net_salary_payable};${emp.name}\n`;
          } else {
            bankTxt += `${accNumber}|${slip.net_salary_payable}|${emp.name}\n`;
          }
        }
      });
      
      downloadFile(`BANK_${selectedBank}_140504.txt`, bankTxt);
      showNotification(`دیسکت پرداخت گروهی بانک ${selectedBank} با موفقیت تولید شد.`, "success");
    } catch (error: any) {
      showNotification(error.message, "error");
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (activeSection === "attendance") {
    // Main attendance module layout
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col max-w-6xl mx-auto w-full" dir="rtl">
        
        {/* Module Nav / Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveSection(null)}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`text-base font-black ${isDarkMode ? "text-slate-100" : "text-slate-900"} flex items-center gap-2`}>
                <Fingerprint className="w-5 h-5 text-indigo-500" /> محاسب کارکرد پرسنل و تطبیق بیومتریک
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                رهگیری تردد خام دستگاه ساعت‌زن، پردازش شیفت‌های چرخشی و شناور منطبق با قانون کار جمهوری اسلامی ایران.
              </p>
            </div>
          </div>
          
          {/* Quick Engine Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={autoReconcileAll}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 flex items-center gap-2 cursor-pointer"
            >
              <Cpu className="w-4 h-4" />
              اجرای موتور تطبیق کلی ترددها
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto">
          {[
            { id: "dashboard", label: "داشبورد عمومی", icon: Layers },
            { id: "shifts", label: "پیکربندی شیفت‌ها", icon: Settings },
            { id: "logs", label: "تردد خام بیومتریک", icon: Fingerprint },
            { id: "daily", label: "کارکرد روزانه روزمزد", icon: Calendar },
            { id: "monthly", label: "تجمیع ماهانه حقوق", icon: FileText },
            { id: "technical", label: "پایگاه داده و کدهای فنی", icon: Code },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = attendanceTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAttendanceTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : isDarkMode 
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60" 
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Body */}
        {attendanceTab === "dashboard" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">پرسنل فعال در محاسبات</span>
                <div className="flex items-center justify-between">
                  <strong className={`text-xl font-black font-mono ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {employees.length} نفر
                  </strong>
                  <Users className="w-5 h-5 text-indigo-500 opacity-80" />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">کل تردهای ثبت شده خام</span>
                <div className="flex items-center justify-between">
                  <strong className={`text-xl font-black font-mono ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {rawLogs.length} آرتیکل
                  </strong>
                  <Fingerprint className="w-5 h-5 text-emerald-500 opacity-80" />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">ترددهای ناقص تعلیق شده</span>
                <div className="flex items-center justify-between">
                  <strong className={`text-xl font-black font-mono ${
                    dailySheets.some(s => s.status === SheetStatus.INCOMPLETE_LOG) ? "text-rose-500" : "text-slate-500"
                  }`}>
                    {dailySheets.filter(s => s.status === SheetStatus.INCOMPLETE_LOG).length} خطا
                  </strong>
                  <AlertTriangle className="w-5 h-5 text-rose-500 opacity-80" />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">اضافه‌کاری دوره (ساعت)</span>
                <div className="flex items-center justify-between">
                  <strong className={`text-xl font-black font-mono ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {(dailySheets.reduce((sum, s) => sum + s.overtime_minutes, 0) / 60).toFixed(1)} ساعت
                  </strong>
                  <Clock className="w-5 h-5 text-blue-500 opacity-80" />
                </div>
              </div>
            </div>

            {/* Quick Demo Walkthrough Guide */}
            <div className={`p-5 rounded-2xl border ${
              isDarkMode ? "bg-slate-950/40 border-slate-850 text-slate-300" : "bg-indigo-50/30 border-indigo-100 text-slate-800"
            }`}>
              <h3 className="font-bold text-xs text-indigo-500 mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> راهنمای گام‌به‌گام شبیه‌سازی برای کارشناس ارشد HR:
              </h3>
              <ol className="text-xs space-y-2 list-decimal list-inside opacity-90 leading-relaxed pr-2">
                <li>ابتدا در تب <strong>تردد خام بیومتریک</strong>، برای یکی از کارمندان (مثلاً علیرضا رضایی) ورود یا خروجی ثبت کنید.</li>
                <li>برای شبیه‌سازی خطا، یک ورود ثبت کنید اما خروجی نزنید.</li>
                <li>سپس به تب <strong>کارکرد روزانه روزمزد</strong> بروید و دکمه <strong>محاسبه مجدد روز</strong> را فشار دهید.</li>
                <li>خواهید دید که لایه اعتبارسنجی آنی، تردد ناقص را ردیابی کرده و وضعیت را به <span className="text-rose-500 font-bold">INCOMPLETE_LOG</span> تغییر می‌دهد!</li>
                <li>اگر جفت تردد کامل باشد، ساعات کار، اضافه‌کاری، شب‌کاری و تاخیر به صورت اتوماتیک محاسبه و در فیش ماهانه (تب آخر) تجمیع می‌شود.</li>
              </ol>
            </div>

            {/* Shifts and general preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className={`text-xs font-black mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"} flex items-center gap-2`}>
                  <Settings className="w-4 h-4 text-indigo-500" /> شیفت‌های کاری معتبر در سیستم کل
                </h3>
                <div className="space-y-3">
                  {shifts.map((s) => (
                    <div key={s.id} className={`p-3 rounded-xl border flex justify-between items-center ${
                      isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"
                    }`}>
                      <div>
                        <strong className="text-xs block text-slate-700 dark:text-slate-200">{s.shift_name}</strong>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          ساعت کاری: {s.start_time} الی {s.end_time} | تعجیل/تاخیر مجاز: {s.allowed_delay_minutes} دقیقه
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-500">
                        {s.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <h3 className={`text-xs font-black mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"} flex items-center gap-2`}>
                  <Users className="w-4 h-4 text-emerald-500" /> لیست پرسنل و انتساب شیفت پایه
                </h3>
                <div className="space-y-3">
                  {employees.map((emp) => {
                    const sh = shifts.find(s => s.id === emp.base_shift_id);
                    return (
                      <div key={emp.id} className={`p-3 rounded-xl border flex justify-between items-center ${
                        isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"
                      }`}>
                        <div>
                          <strong className="text-xs block text-slate-700 dark:text-slate-200">{emp.name}</strong>
                          <span className="text-[10px] text-slate-400 mt-1 block">سمت: {emp.role}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                          {sh?.shift_name || "شناور"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Shift Configuration */}
        {attendanceTab === "shifts" && (
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className="text-sm font-black mb-4 flex items-center gap-2 text-indigo-500">
                <Settings className="w-5 h-5" /> تعریف شیفت کاری جدید
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">نام شیفت</label>
                  <input
                    type="text"
                    placeholder="مثلاً شیفت عصرکار کارخانه"
                    value={newShift.shift_name}
                    onChange={(e) => setNewShift(prev => ({ ...prev, shift_name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">نوع شیفت</label>
                  <select
                    value={newShift.type}
                    onChange={(e) => setNewShift(prev => ({ ...prev, type: e.target.value as ShiftType }))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value={ShiftType.FIXED}>ثابت (Fixed)</option>
                    <option value={ShiftType.ROTATIONAL}>چرخشی (Rotational)</option>
                    <option value={ShiftType.FLOATING}>شناور (Floating)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">شروع ساعت کاری</label>
                  <input
                    type="time"
                    value={newShift.start_time}
                    onChange={(e) => setNewShift(prev => ({ ...prev, start_time: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">پایان ساعت کاری</label>
                  <input
                    type="time"
                    value={newShift.end_time}
                    onChange={(e) => setNewShift(prev => ({ ...prev, end_time: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">مدت استراحت / ناهار (دقیقه)</label>
                  <input
                    type="number"
                    value={newShift.break_duration_minutes}
                    onChange={(e) => setNewShift(prev => ({ ...prev, break_duration_minutes: Number(e.target.value) }))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">تاخیر مجاز روزانه (دقیقه)</label>
                  <input
                    type="number"
                    value={newShift.allowed_delay_minutes}
                    onChange={(e) => setNewShift(prev => ({ ...prev, allowed_delay_minutes: Number(e.target.value) }))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAddShift}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> ثبت پیکربندی شیفت
                </button>
              </div>
            </div>

            {/* List of active shifts */}
            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className="text-xs font-black text-slate-400 mb-3">پایگاه داده شیفت‌های کاری معتبر (work_shifts)</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-850">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? "bg-slate-950 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
                      <th className="p-3">کد شناسه</th>
                      <th className="p-3">نام شیفت</th>
                      <th className="p-3">نوع فرمولاسیون</th>
                      <th className="p-3">بازه حضور</th>
                      <th className="p-3">مدت کسر استراحت</th>
                      <th className="p-3">حد تعجیل و تاخیر مجاز</th>
                      <th className="p-3 text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shifts.map((s) => (
                      <tr key={s.id} className="border-b last:border-0 border-slate-100 dark:border-slate-850 hover:bg-slate-50/10">
                        <td className="p-3 font-mono text-indigo-500 font-bold">#{s.id}</td>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{s.shift_name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{s.type}</span>
                        </td>
                        <td className="p-3 font-mono">{s.start_time} - {s.end_time}</td>
                        <td className="p-3 font-mono text-slate-500">{s.break_duration_minutes} دقیقه</td>
                        <td className="p-3 font-mono text-slate-500">{s.allowed_delay_minutes} دقیقه</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-500">
                            فعال دفتری
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Biometric Raw Logs */}
        {attendanceTab === "logs" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Biometric Terminal Simulator Form */}
              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <div className="flex items-center gap-2 text-indigo-500 mb-4">
                  <Fingerprint className="w-5 h-5 animate-pulse" />
                  <h3 className="font-black text-xs">شبیه‌ساز دستگاه کارت‌زنی بیومتریک</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">انتخاب پرسنل</label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                      className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                      }`}
                    >
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">تاریخ تردد فیزیکی</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">ساعت تردد</label>
                    <input
                      type="time"
                      value={logTime}
                      onChange={(e) => setLogTime(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${
                        isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">جهت تردد (Log Type)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLogDirection(LogType.IN)}
                        className={`py-2 text-xs font-bold rounded-xl border transition ${
                          logDirection === LogType.IN 
                            ? "bg-emerald-500 text-white border-emerald-500" 
                            : isDarkMode 
                              ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white" 
                              : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        ورود (IN)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogDirection(LogType.OUT)}
                        className={`py-2 text-xs font-bold rounded-xl border transition ${
                          logDirection === LogType.OUT 
                            ? "bg-rose-500 text-white border-rose-500" 
                            : isDarkMode 
                              ? "bg-slate-950 border-slate-800 text-slate-400 hover:text-white" 
                              : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        خروج (OUT)
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={simulateBiometricLog}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Fingerprint className="w-4 h-4" /> ثبت در لاگ خام دستگاه ساعت‌زن
                  </button>
                </div>
              </div>

              {/* Logs database list */}
              <div className="lg:col-span-2 space-y-4">
                <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-black text-slate-400">بانک اطلاعاتی ترددهای خام (attendance_raw_logs)</h3>
                    <button
                      onClick={() => {
                        setRawLogs([]);
                        showNotification("پایگاه داده ترددهای خام تخلیه گردید.", "info");
                      }}
                      className="text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 px-2 py-1 rounded-lg transition"
                    >
                      تخلیه کامل جدول
                    </button>
                  </div>

                  <div className="overflow-y-auto max-h-[300px] rounded-xl border border-slate-100 dark:border-slate-850">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? "bg-slate-950 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
                          <th className="p-3">کد تراکنش</th>
                          <th className="p-3">شناسه پرسنلی</th>
                          <th className="p-3">نام پرسنل</th>
                          <th className="p-3">تاریخ و ساعت دقیق</th>
                          <th className="p-3">شناسه دستگاه</th>
                          <th className="p-3">جهت</th>
                          <th className="p-3">عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rawLogs.map((log) => {
                          const emp = employees.find(e => e.id === log.employee_id);
                          return (
                            <tr key={log.id} className="border-b last:border-0 border-slate-100 dark:border-slate-850 hover:bg-slate-50/10">
                              <td className="p-3 font-mono text-slate-400">#{log.id}</td>
                              <td className="p-3 font-mono">{log.employee_id}</td>
                              <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{emp?.name || "حذف شده"}</td>
                              <td className="p-3 font-mono">{log.log_timestamp}</td>
                              <td className="p-3 font-mono text-slate-400">{log.device_id}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  log.log_type === LogType.IN 
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" 
                                    : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                }`}>
                                  {log.log_type === LogType.IN ? "ورود (IN)" : "خروج (OUT)"}
                                </span>
                              </td>
                              <td className="p-3">
                                <button
                                  onClick={() => {
                                    setRawLogs(prev => prev.filter(l => l.id !== log.id));
                                    showNotification("رکورد تردد خام حذف گردید.", "info");
                                  }}
                                  className="p-1 rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {rawLogs.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-400 italic">هیچ داده ترددی در سیستم ثبت نشده است. از ماژول شبیه‌ساز اثر انگشت استفاده کنید.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab: Daily Attendance Sheets */}
        {attendanceTab === "daily" && (
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-850 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" /> محاسبات تفصیلی کارکرد روزانه (attendance_daily_sheets)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">ثبت گزارش و پردازش ترازهای روزمزد قانون کار با قابلیت ردیابی ترددهای نامنظم</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                    className={`px-3 py-2 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={`px-3 py-2 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  />
                  <button
                    onClick={() => processDailyAttendance(selectedEmployeeId, selectedDate)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" /> محاسبه مجدد روز
                  </button>
                </div>
              </div>

              {/* Grid of daily calculations */}
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-850">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className={`border-b ${isDarkMode ? "bg-slate-950 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
                      <th className="p-3">پرسنل</th>
                      <th className="p-3">تاریخ سند</th>
                      <th className="p-3">اولین ورود</th>
                      <th className="p-3">آخرین خروج</th>
                      <th className="p-3">کارکرد عادی (ساعت)</th>
                      <th className="p-3">اضافه‌کار (ساعت)</th>
                      <th className="p-3">شب‌کاری (ساعت)</th>
                      <th className="p-3">تاخیر (دقیقه)</th>
                      <th className="p-3">غیبت / تعجیل</th>
                      <th className="p-3">وضعیت تایید</th>
                      <th className="p-3">خطا / هشدارهای سیستم</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySheets.map((sheet) => {
                      const emp = employees.find(e => e.id === sheet.employee_id);
                      return (
                        <tr key={sheet.id} className={`border-b last:border-0 border-slate-100 dark:border-slate-850 hover:bg-slate-50/10 ${
                          sheet.status === SheetStatus.INCOMPLETE_LOG ? "bg-rose-500/5" : ""
                        }`}>
                          <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{emp?.name || "نامشخص"}</td>
                          <td className="p-3 font-mono">{sheet.date}</td>
                          <td className="p-3 font-mono text-slate-500">{sheet.first_in || "--"}</td>
                          <td className="p-3 font-mono text-slate-500">{sheet.last_out || "--"}</td>
                          <td className="p-3 font-mono font-bold text-indigo-500">{(sheet.regular_work_minutes / 60).toFixed(2)}</td>
                          <td className="p-3 font-mono text-blue-500">{(sheet.overtime_minutes / 60).toFixed(2)}</td>
                          <td className="p-3 font-mono text-purple-500">{(sheet.night_work_minutes / 60).toFixed(2)}</td>
                          <td className="p-3 font-mono text-amber-500">{sheet.delay_minutes}</td>
                          <td className="p-3 font-mono text-rose-500">{sheet.absence_minutes > 0 ? "غیبت کامل" : sheet.early_leave_minutes > 0 ? `${sheet.early_leave_minutes} د تعجیل` : "منطبق"}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sheet.status === SheetStatus.APPROVED_BY_MANAGER ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" :
                              sheet.status === SheetStatus.FINALIZED ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                              sheet.status === SheetStatus.INCOMPLETE_LOG ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {sheet.status === SheetStatus.APPROVED_BY_MANAGER ? "تایید سرپرست" :
                               sheet.status === SheetStatus.FINALIZED ? "نهایی و مصوب" :
                               sheet.status === SheetStatus.INCOMPLETE_LOG ? "تردد ناقص!" : "پیش‌نویس"}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-rose-500 max-w-[200px] truncate" title={sheet.warning_message}>
                            {sheet.warning_message || "✅ بدون خطا"}
                          </td>
                          <td className="p-3 text-center">
                            {sheet.status !== SheetStatus.FINALIZED && sheet.status !== SheetStatus.INCOMPLETE_LOG && (
                              <button
                                onClick={() => {
                                  setDailySheets(prev => prev.map(s => s.id === sheet.id ? { ...s, status: SheetStatus.FINALIZED } : s));
                                  showNotification("سند کارکرد روزانه به تصویب نهایی رسید.", "success");
                                }}
                                className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold transition cursor-pointer"
                              >
                                تصویب سند
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {dailySheets.length === 0 && (
                      <tr>
                        <td colSpan={12} className="p-6 text-center text-slate-400 italic">هیچ گزارش کارکردی صادر نشده است. دکمه «محاسبه مجدد روز» را در بالا کلیک کنید.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Monthly Aggregator & Summary */}
        {attendanceTab === "monthly" && (
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-850 dark:text-white">تجمیع نهایی و گزارش کارکرد ماهانه پرسنل</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">محاسبه خالص ساعات کار ماهانه پرسنل جهت ارسال مستقیم به موتور پردازش فیش حقوقی</p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                    className={`px-3 py-1.5 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>

              {(() => {
                const summary = generateMonthlyAttendanceSummary(selectedEmployeeId, 2026, 7);
                const emp = employees.find(e => e.id === selectedEmployeeId);
                return (
                  <div className="space-y-6">
                    {/* Visual Card Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className={`p-4 rounded-xl border text-center ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[9px] text-slate-400 block mb-1">روزهای کارکرد</span>
                        <strong className="text-sm font-mono text-indigo-500 font-black">{summary.totalWorkingDays} روز</strong>
                      </div>

                      <div className={`p-4 rounded-xl border text-center ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[9px] text-slate-400 block mb-1">مجموع ساعت عادی</span>
                        <strong className="text-sm font-mono text-slate-700 dark:text-slate-200 font-black">{summary.totalRegularHours} س</strong>
                      </div>

                      <div className={`p-4 rounded-xl border text-center ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[9px] text-slate-400 block mb-1">اضافه‌کار مصوب</span>
                        <strong className="text-sm font-mono text-blue-500 font-black">{summary.totalOvertimeHours} س</strong>
                      </div>

                      <div className={`p-4 rounded-xl border text-center ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[9px] text-slate-400 block mb-1">شب‌کاری دفتری</span>
                        <strong className="text-sm font-mono text-purple-500 font-black">{summary.totalNightHours} س</strong>
                      </div>

                      <div className={`p-4 rounded-xl border text-center ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[9px] text-slate-400 block mb-1">تاخیر کل کسر شده</span>
                        <strong className="text-sm font-mono text-amber-500 font-black">{summary.totalDelayHours} س</strong>
                      </div>

                      <div className={`p-4 rounded-xl border text-center ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                        <span className="text-[9px] text-slate-400 block mb-1">کسر کار / غیبت</span>
                        <strong className="text-sm font-mono text-rose-500 font-black">{summary.totalAbsenceDays} روز</strong>
                      </div>
                    </div>

                    {/* Salary integration review */}
                    <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-950/30 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
                      <h4 className="font-black text-xs text-slate-400 mb-3 flex items-center gap-2">
                        <Building className="w-4 h-4 text-emerald-500" /> محاسبه فوق‌العاده نوبت‌کاری قانون کار (حفاظت ارزش حقوقی)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                        <div className="space-y-2">
                          <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                            <span className="text-slate-400">نام کامل کارمند:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{emp?.name}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                            <span className="text-slate-400">حقوق پایه ماهیانه مصوب:</span>
                            <span className="font-mono font-bold">{emp?.base_salary.toLocaleString()} ریال</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                            <span className="text-slate-400">ضریب فوق‌العاده نوبت‌کاری (قانون کار):</span>
                            <span className="font-bold text-emerald-500">{summary.shiftAllowanceRate}%</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                            <span className="text-slate-400">مبلغ نهایی فوق‌العاده نوبت‌کاری افزوده:</span>
                            <span className="font-mono font-bold text-emerald-500">{summary.shiftAllowanceAmount.toLocaleString()} ریال</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tab: Technical Specs (DDL/ORM/TS Service) */}
        {attendanceTab === "technical" && (
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-2 text-indigo-500 mb-4">
                <Database className="w-5 h-5" />
                <h3 className="font-black text-sm">مستندات مهندسی نرم‌افزار و معماری دیتابیس (PostgreSQL)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                جهت سهولت پیاده‌سازی و یکپارچه‌سازی ماژول تردد خام، معماری و ساختار پایگاه داده و منطق تراکنشی با استانداردهای مدرن منطبق گردیده است.
              </p>

              <div className="space-y-4">
                {/* DDL */}
                <div>
                  <h4 className="text-xs font-black text-slate-300 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> ساختار جداول پایگاه داده فیزیکی (PostgreSQL DDL)
                  </h4>
                  <pre className="p-4 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto text-left" dir="ltr">
{`-- Work Shifts Table
CREATE TABLE work_shifts (
    id SERIAL PRIMARY KEY,
    shift_name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('FIXED', 'ROTATIONAL', 'FLOATING')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INT NOT NULL DEFAULT 60,
    allowed_delay_minutes INT NOT NULL DEFAULT 15,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- Attendance Raw Logs Table
CREATE TABLE attendance_raw_logs (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL, -- Link to Personnel/Detailed Account
    log_timestamp TIMESTAMP NOT NULL,
    device_id VARCHAR(50) NOT NULL,
    log_type VARCHAR(20) NOT NULL CHECK (log_type IN ('IN', 'OUT', 'UNKNOWN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_raw_logs_emp_timestamp ON attendance_raw_logs(employee_id, log_timestamp);

-- Attendance Daily Sheets Table
CREATE TABLE attendance_daily_sheets (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    shift_id INT REFERENCES work_shifts(id),
    first_in TIME,
    last_out TIME,
    regular_work_minutes INT NOT NULL DEFAULT 0,
    overtime_minutes INT NOT NULL DEFAULT 0,
    night_work_minutes INT NOT NULL DEFAULT 0,
    delay_minutes INT NOT NULL DEFAULT 0,
    early_leave_minutes INT NOT NULL DEFAULT 0,
    absence_minutes INT NOT NULL DEFAULT 0,
    leave_type VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (leave_type IN ('NONE', 'EARNED', 'SICK', 'UNPAID')),
    leave_minutes INT NOT NULL DEFAULT 0,
    mission_type VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (mission_type IN ('NONE', 'HOURLY', 'DAILY')),
    mission_minutes INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED_BY_MANAGER', 'FINALIZED', 'INCOMPLETE_LOG')),
    UNIQUE (employee_id, date)
);`}
                  </pre>
                </div>

                {/* TS core script */}
                <div>
                  <h4 className="text-xs font-black text-slate-300 mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4 text-blue-500" /> کلاس پردازش تراکنش و تطبیق تردد (TypeScript Service Class)
                  </h4>
                  <pre className="p-4 bg-slate-950 rounded-xl text-[11px] font-mono text-blue-400 overflow-x-auto text-left" dir="ltr">
{`export class AttendanceCalculationService {
  /**
   * Calculates and saves daily hours compliant with Iranian Labor Law.
   * Ensures transaction safety (ACID).
   */
  async processDailyAttendance(employeeId: number, date: string, dbTransaction: any): Promise<void> {
    // 1. Fetch raw logs for the day
    const logs = await dbTransaction.query(
      'SELECT * FROM attendance_raw_logs WHERE employee_id = $1 AND DATE(log_timestamp) = $2 ORDER BY log_timestamp ASC',
      [employeeId, date]
    );

    if (logs.length === 0) {
      // Create Absence record
      await dbTransaction.insertDailySheet({
        employee_id: employeeId,
        date: date,
        regular_work_minutes: 0,
        absence_minutes: 440, // Standard work day (7.33 hours)
        status: 'DRAFT'
      });
      return;
    }

    // 2. Filter IN and OUT
    const ins = logs.filter(l => l.log_type === 'IN');
    const outs = logs.filter(l => l.log_type === 'OUT');

    // STRICT RULE: Missing Logs verification
    if (ins.length === 0 || outs.length === 0 || logs.length % 2 !== 0) {
      await dbTransaction.insertDailySheet({
        employee_id: employeeId,
        date: date,
        status: 'INCOMPLETE_LOG',
        warning_message: 'Incomplete biometric matching: missing log sequence.'
      });
      return;
    }

    const firstIn = ins[0].log_timestamp;
    const lastOut = outs[outs.length - 1].log_timestamp;

    // Calculate elapsed minutes
    let diffMs = new Date(lastOut).getTime() - new Date(firstIn).getTime();
    let totalPresenceMinutes = Math.floor(diffMs / 60000);

    // Fetch shift
    const employee = await dbTransaction.getEmployee(employeeId);
    const shift = await dbTransaction.getShift(employee.base_shift_id);

    // Allowed grace delay evaluation
    let delayMinutes = 0;
    const firstInTime = firstIn.split(' ')[1].substring(0, 5);
    const shiftStartTime = shift.start_time.substring(0, 5);
    
    const actualDelay = this.timeToMinutes(firstInTime) - this.timeToMinutes(shiftStartTime);
    if (actualDelay > shift.allowed_delay_minutes) {
      delayMinutes = actualDelay;
    }

    const netWorkingMinutes = Math.max(0, totalPresenceMinutes - shift.break_duration_minutes);
    const regularWorkMinutes = Math.min(440, netWorkingMinutes);
    const overtimeMinutes = netWorkingMinutes > 440 ? netWorkingMinutes - 440 : 0;

    // Night work minutes evaluator (22:00 to 06:00)
    const nightMinutes = this.evaluateNightWork(firstIn, lastOut);

    // 3. Save or update sheet
    await dbTransaction.upsertDailySheet({
      employee_id: employeeId,
      date: date,
      shift_id: shift.id,
      first_in: firstInTime,
      last_out: lastOut.split(' ')[1].substring(0, 5),
      regular_work_minutes: regularWorkMinutes,
      overtime_minutes: overtimeMinutes,
      night_work_minutes: nightMinutes,
      delay_minutes: delayMinutes,
      status: 'APPROVED_BY_MANAGER'
    });
  }

  private timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  private evaluateNightWork(start: string, end: string): number {
    let nightMins = 0;
    let curr = new Date(start).getTime();
    const stop = new Date(end).getTime();

    while (curr < stop) {
      const dateObj = new Date(curr);
      const hour = dateObj.getHours();
      if (hour >= 22 || hour < 6) {
        nightMins++;
      }
      curr += 60000; // Step by 1 minute
    }
    return nightMins;
  }
}`}
                  </pre>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  if (activeSection === "payslips") {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col max-w-6xl mx-auto w-full" dir="rtl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveSection(null)}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`text-base font-black ${isDarkMode ? "text-slate-100" : "text-slate-900"} flex items-center gap-2`}>
                <FileText className="w-5 h-5 text-indigo-500" /> صدور فیش حقوقی و دستمزد
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                محاسبه حقوق و مزایا، بیمه، مالیات پلکانی و تولید سند حسابداری اتوماتیک (Auto-Vouchering).
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto">
          {[
            { id: "dashboard", label: "خلاصه وضعیت دوره", icon: Layers },
            { id: "calculator", label: "ماشین حساب حقوق", icon: Cpu },
            { id: "slips", label: "فیش‌های حقوقی صادره", icon: FileText },
            { id: "vouchers", label: "سند حسابداری اتوماتیک", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = payslipTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPayslipTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : isDarkMode 
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60" 
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dashboard */}
        {payslipTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">تعداد فیش‌های محاسباتی</span>
                <div className="flex items-center justify-between">
                  <strong className={`text-xl font-black font-mono ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {payrollSlips.length} عدد
                  </strong>
                  <FileText className="w-5 h-5 text-indigo-500 opacity-80" />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">مجموع حقوق پرداختی (خالص)</span>
                <div className="flex items-center justify-between">
                  <strong className={`text-lg font-black font-mono ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {payrollSlips.reduce((sum, s) => sum + s.net_salary_payable, 0).toLocaleString()} <span className="text-[10px] font-sans">ریال</span>
                  </strong>
                  <Building className="w-5 h-5 text-emerald-500 opacity-80" />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">بیمه کارفرما و کارگر</span>
                <div className="flex items-center justify-between">
                  <strong className={`text-lg font-black font-mono ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {payrollSlips.reduce((sum, s) => sum + s.employee_insurance_amount + s.employer_insurance_amount, 0).toLocaleString()} <span className="text-[10px] font-sans">ریال</span>
                  </strong>
                  <ShieldCheck className="w-5 h-5 text-blue-500 opacity-80" />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                <span className="text-[10px] font-bold text-slate-400 block mb-1">مالیات مکسوره</span>
                <div className="flex items-center justify-between">
                  <strong className={`text-lg font-black font-mono ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {payrollSlips.reduce((sum, s) => sum + s.tax_amount, 0).toLocaleString()} <span className="text-[10px] font-sans">ریال</span>
                  </strong>
                  <AlertTriangle className="w-5 h-5 text-rose-500 opacity-80" />
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${
              isDarkMode ? "bg-slate-950/40 border-slate-850 text-slate-300" : "bg-indigo-50/30 border-indigo-100 text-slate-800"
            }`}>
              <h3 className="font-bold text-xs text-indigo-500 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> فرآیند هوشمند محاسبه حقوق
              </h3>
              <p className="text-xs leading-relaxed opacity-90 pr-6">
                موتور پردازش حقوق به صورت خودکار مقادیر خام تردد را از سیستم حضور و غیاب دریافت کرده، قوانین بیمه تامین اجتماعی شامل سقف حق بیمه و قوانین مالیات بر درآمد حقوق (پلکانی سال جاری) را بر اساس ساختار مصوب روی آن اعمال می‌کند.
              </p>
            </div>
          </div>
        )}

        {/* Calculator */}
        {payslipTab === "calculator" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className="text-sm font-black mb-4 flex items-center gap-2 text-indigo-500">
                <Cpu className="w-5 h-5" /> موتور محاسبه حقوق و دستمزد
              </h3>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-[10px] text-slate-400 mb-1">انتخاب دوره حقوقی</label>
                  <select
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    {payrollPeriods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => autoGenerateAllPayslips(1)}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <Play className="w-4 h-4" /> محاسبه و صدور فیش برای تمام پرسنل
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-500 leading-relaxed border-t border-slate-200 dark:border-slate-800 pt-4">
                <strong>توضیحات فنی:</strong> موتور محاسباتی در یک تراکنش یکپارچه:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>استخراج کارکرد ماهیانه (حضور، اضافه‌کاری، شب‌کاری)</li>
                  <li>محاسبه پایه و مزایای مستمر و غیرمستمر</li>
                  <li>محاسبه بیمه تامین اجتماعی (با در نظر گرفتن سقف مجاز ۷ برابر حداقل دستمزد)</li>
                  <li>محاسبه مالیات پلکانی طبق جدول مالیاتی معتبر سال</li>
                  <li>ثبت ریز آیتم‌های فیش حقوقی (earning/deduction)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Payslips */}
        {payslipTab === "slips" && (
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <h3 className="text-xs font-black text-slate-400 mb-3">فیش‌های حقوقی تولید شده</h3>
              
              {payrollSlips.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-xs">
                  فیش حقوقی در این دوره صادر نشده است. از منوی موتور محاسبه اقدام کنید.
                </div>
              ) : (
                <div className="space-y-4">
                  {payrollSlips.map(slip => {
                    const emp = employees.find(e => e.id === slip.employee_id);
                    const slipLines = payrollSlipLines.filter(l => l.payroll_slip_id === slip.id);
                    
                    return (
                      <div key={slip.id} className={`p-4 rounded-xl border ${
                        isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"
                      }`}>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                          <div>
                            <strong className="text-sm block text-slate-700 dark:text-slate-200">{emp?.name}</strong>
                            <span className="text-[10px] text-slate-400 mt-1 block">روزهای کارکرد: {slip.regular_days_worked} روز | اضافه کاری: {slip.overtime_hours} ساعت</span>
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] font-bold block mb-1 text-slate-500">خالص پرداختی:</span>
                            <span className="text-base font-black font-mono text-emerald-500">{slip.net_salary_payable.toLocaleString()} ریال</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Earnings */}
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">مزایا (Earnings)</h4>
                            <div className="space-y-1.5">
                              {slipLines.filter(l => l.item_type === SlipLineItemType.EARNING).map(line => (
                                <div key={line.id} className="flex justify-between items-center text-xs">
                                  <span className="text-slate-600 dark:text-slate-300">{line.item_name}</span>
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{line.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold mt-2 pt-2 border-t border-dashed border-emerald-200 dark:border-emerald-900">
                              <span className="text-slate-700 dark:text-slate-200">جمع مزایا:</span>
                              <span className="font-mono text-emerald-600">{slip.gross_earnings.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Deductions */}
                          <div>
                            <h4 className="text-[10px] font-bold text-slate-400 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">کسورات (Deductions)</h4>
                            <div className="space-y-1.5">
                              {slipLines.filter(l => l.item_type === SlipLineItemType.DEDUCTION).map(line => (
                                <div key={line.id} className="flex justify-between items-center text-xs">
                                  <span className="text-slate-600 dark:text-slate-300">{line.item_name}</span>
                                  <span className="font-mono text-rose-600 dark:text-rose-400">{line.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between items-center text-xs font-bold mt-2 pt-2 border-t border-dashed border-rose-200 dark:border-rose-900">
                              <span className="text-slate-700 dark:text-slate-200">جمع کسورات:</span>
                              <span className="font-mono text-rose-600">{slip.total_deductions.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vouchers */}
        {payslipTab === "vouchers" && (
          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-400">سند حسابداری حقوق (تولید خودکار)</h3>
                <span className="px-3 py-1 rounded bg-indigo-500/10 text-indigo-500 text-[10px] font-bold">Auto-Vouchering</span>
              </div>

              {payrollSlips.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic text-xs">
                  جهت تولید سند حسابداری حقوق ابتدا باید فیش‌های حقوقی را محاسبه کنید.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-850">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? "bg-slate-950 border-slate-850 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"}`}>
                          <th className="p-3">کد کل/معین/تفصیلی</th>
                          <th className="p-3">عنوان حساب</th>
                          <th className="p-3 text-center">بدهکار (ریال)</th>
                          <th className="p-3 text-center">بستانکار (ریال)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* 1. Debit Expenses */}
                        <tr className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/10">
                          <td className="p-3 font-mono text-slate-400">601-1001-000</td>
                          <td className="p-3 font-bold text-slate-700 dark:text-slate-300">هزینه حقوق و دستمزد</td>
                          <td className="p-3 font-mono text-center text-indigo-500">{payrollSlips.reduce((sum, s) => sum + s.gross_earnings, 0).toLocaleString()}</td>
                          <td className="p-3 font-mono text-center">0</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/10">
                          <td className="p-3 font-mono text-slate-400">601-1005-000</td>
                          <td className="p-3 font-bold text-slate-700 dark:text-slate-300">هزینه بیمه تامین اجتماعی (سهم کارفرما ۲۳٪)</td>
                          <td className="p-3 font-mono text-center text-indigo-500">{payrollSlips.reduce((sum, s) => sum + s.employer_insurance_amount, 0).toLocaleString()}</td>
                          <td className="p-3 font-mono text-center">0</td>
                        </tr>
                        
                        {/* 2. Credit Payables */}
                        <tr className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/10">
                          <td className="p-3 font-mono text-slate-400">401-2001-000</td>
                          <td className="p-3 font-bold text-slate-700 dark:text-slate-300">مالیات تکلیفی حقوق پرداختنی</td>
                          <td className="p-3 font-mono text-center">0</td>
                          <td className="p-3 font-mono text-center text-rose-500">{payrollSlips.reduce((sum, s) => sum + s.tax_amount, 0).toLocaleString()}</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/10">
                          <td className="p-3 font-mono text-slate-400">401-2002-000</td>
                          <td className="p-3 font-bold text-slate-700 dark:text-slate-300">بیمه پرداختنی سازمان تامین اجتماعی (۳۰٪ کل)</td>
                          <td className="p-3 font-mono text-center">0</td>
                          <td className="p-3 font-mono text-center text-rose-500">{payrollSlips.reduce((sum, s) => sum + s.employee_insurance_amount + s.employer_insurance_amount, 0).toLocaleString()}</td>
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-850 hover:bg-slate-50/10 bg-slate-50/50 dark:bg-slate-800/20">
                          <td className="p-3 font-mono text-slate-400">401-2003-###</td>
                          <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                            حقوق پرداختنی پرسنل (تجميع تفصیلی‌ها)
                            <div className="text-[10px] font-normal text-slate-400 mt-1">شناور برای {payrollSlips.length} کارمند</div>
                          </td>
                          <td className="p-3 font-mono text-center">0</td>
                          <td className="p-3 font-mono text-center text-rose-500">{payrollSlips.reduce((sum, s) => sum + s.net_salary_payable, 0).toLocaleString()}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr className="font-bold border-t-2 border-slate-200 dark:border-slate-700">
                          <td className="p-3" colSpan={2}>تراز کل سند (باید صفر باشد)</td>
                          <td className="p-3 font-mono text-center text-emerald-500">
                            {(payrollSlips.reduce((sum, s) => sum + s.gross_earnings + s.employer_insurance_amount, 0)).toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-center text-emerald-500">
                            {(payrollSlips.reduce((sum, s) => sum + s.tax_amount + s.employee_insurance_amount + s.employer_insurance_amount + s.net_salary_payable, 0)).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <button
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                      onClick={() => showNotification("سند حسابداری حقوق با موفقیت در سیستم مرکزی فایننس ثبت شد.", "success")}
                    >
                      <CheckCircle2 className="w-4 h-4" /> تایید و ثبت قطعی سند در دفتر روزنامه
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  }

  if (activeSection === "legal-files") {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col max-w-6xl mx-auto w-full" dir="rtl">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveSection(null)}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                isDarkMode 
                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white" 
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className={`text-base font-black ${isDarkMode ? "text-slate-100" : "text-slate-900"} flex items-center gap-2`}>
                <FileBadge className="w-5 h-5 text-emerald-500" /> صدور دیسکت‌های قانونی
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                تهیه فایل‌های بیمه تامین اجتماعی (DBF)، مالیات بر درآمد (TXT) و فایل پرداخت گروهی بانک‌ها.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto">
          {[
            { id: "dashboard", label: "داشبورد فایل‌های قانونی", icon: Layers },
            { id: "insurance", label: "دیسکت تامین اجتماعی", icon: ShieldCheck },
            { id: "tax", label: "دیسکت امور مالیاتی", icon: AlertTriangle },
            { id: "bank", label: "دیسکت پرداخت بانک", icon: BookOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = legalFilesTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setLegalFilesTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? "bg-emerald-600 text-white shadow-sm" 
                    : isDarkMode 
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60" 
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Insurance Tab */}
        {legalFilesTab === "insurance" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black flex items-center gap-2 text-blue-500">
                    <ShieldCheck className="w-5 h-5" /> دیسکت بیمه تامین اجتماعی
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">تولید خودکار فایل‌های کارگاه (DSKKAR00) و کارکنان (DSKWOR00)</p>
                </div>
                <button
                  onClick={generateSocialSecurityFiles}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> تولید و دانلود دیسکت بیمه
                </button>
              </div>

              <div className={`p-4 rounded-xl text-xs border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                <strong className="text-slate-700 dark:text-slate-300 block mb-2">ملاحظات فنی انکدینگ (Persian Encoding):</strong>
                <p className="text-slate-500 leading-relaxed mb-2">
                  نرم‌افزار لیست دیسک تامین اجتماعی ایران فقط کاراکترهای با استاندارد <strong>Windows-1256 (Arabic/Persian)</strong> را به درستی در محیط DOS/ویندوزهای قدیمی می‌خواند. این سیستم فایل‌ها را در قالب متنی صادر می‌کند. در محیط عملیاتی واقعی (Production)، سرویس پایتون از کتابخانه <code>dbf</code> برای نوشتن فرمت باینری dBase IV با انکدینگ مربوطه استفاده خواهد کرد.
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-mono">DSKKAR00.DBF</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-mono">DSKWOR00.DBF</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tax Tab */}
        {legalFilesTab === "tax" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black flex items-center gap-2 text-rose-500">
                    <AlertTriangle className="w-5 h-5" /> دیسکت مالیات بر درآمد حقوق
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">تولید فایل‌های متنی خلاصه، هدر و ریز حقوق کارکنان جهت سامانه Tax.gov.ir</p>
                </div>
                <button
                  onClick={generateTaxFiles}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> تولید و دانلود دیسکت مالیات
                </button>
              </div>

              <div className={`p-4 rounded-xl text-xs border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                <strong className="text-slate-700 dark:text-slate-300 block mb-2">فرمت فایل‌های سامانه مالیاتی (Fixed-Width/CSV):</strong>
                <p className="text-slate-500 leading-relaxed mb-2">
                  فایل‌های صادره حاوی اطلاعات هویتی کامل کارکنان و تفکیک مبالغ مشمول مالیات، معافیت‌ها و مالیات مکسوره بر اساس جداول پلکانی سازمان امور مالیاتی می‌باشند. در این خروجی، داده‌ها به صورت CSV و بر اساس ساختار WH، WP و WK تولید می‌شوند.
                </p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded font-mono">WH.txt</span>
                  <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded font-mono">WP.txt</span>
                  <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded font-mono">WK.txt</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Tab */}
        {legalFilesTab === "bank" && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4">
                <div>
                  <h3 className="text-sm font-black flex items-center gap-2 text-emerald-500">
                    <BookOpen className="w-5 h-5" /> دیسکت پرداخت گروهی بانک‌ها
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">تولید فایل متنی (TXT) جهت بارگذاری در اینترنت بانک برای واریز گروهی حقوق</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className={`px-3 py-2 border rounded-xl text-xs outline-none ${
                      isDarkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    <option value="MELLAT">بانک ملت</option>
                    <option value="MELLI">بانک ملی ایران</option>
                    <option value="PASARGAD">بانک پاسارگاد</option>
                  </select>
                  
                  <button
                    onClick={generateBankFile}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> تولید و دانلود فایل بانک
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-xl text-xs border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-slate-50 border-slate-100"}`}>
                <strong className="text-slate-700 dark:text-slate-300 block mb-2">ساختار فایل دیسکت بانک (Bank Template Type):</strong>
                <p className="text-slate-500 leading-relaxed">
                  هر بانک ساختار متنی مختص به خود را دارد. به عنوان مثال <strong>بانک ملت</strong> فرمت: <code>ردیف,شماره شبا,مبلغ(ریال),Y,نام گیرنده</code> را می‌پذیرد. این ماژول بر اساس بانک انتخابی، داده‌ها را فورمت‌بندی کرده و خروجی مناسب را تولید می‌کند.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {legalFilesTab === "dashboard" && (
          <div className={`p-12 rounded-3xl border border-dashed flex flex-col items-center justify-center text-center ${
            isDarkMode ? "bg-slate-900/30 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
          }`}>
            <FileBadge className="w-16 h-16 mb-4 opacity-50 text-emerald-500" />
            <p className="font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">داشبورد دیسکت‌های قانونی</p>
            <p className="text-xs max-w-lg leading-relaxed">
              جهت صدور دیسکت‌های قانونی (تامین اجتماعی، مالیات و پرداخت گروهی بانک)، لطفاً از زبانه‌های بالا سازمان مورد نظر را انتخاب کنید. اطلاعات از فیش‌های حقوقی صادر شده استخراج می‌شود.
            </p>
          </div>
        )}

      </div>
    );
  }

  const sections = [
    {
      id: "attendance",
      title: "محاسبه کارکرد",
      desc: "اتصال به دستگاه‌های حضور و غیاب برای محاسبه ساعات کار، اضافه‌کار و تاخیر.",
      icon: Clock,
      badge: "قانون کار ایران",
      accent: "text-indigo-500 dark:text-indigo-400 bg-indigo-500/10",
    },
    {
      id: "payslips",
      title: "صدور فیش حقوقی",
      desc: "محاسبه حقوق پایه، مزایا، کسورات (بیمه، مالیات، وام) و صدور فیش.",
      icon: FileText,
      badge: "جامع",
      accent: "text-purple-500 dark:text-purple-400 bg-purple-500/10",
    },
    {
      id: "legal-files",
      title: "فایل‌های قانونی",
      desc: "تهیه خودکار فایل‌های بیمه تامین اجتماعی و مالیات بر درآمد حقوق برای ارسال به سازمان‌های مربوطه.",
      icon: FileBadge,
      badge: "تامین اجتماعی",
      accent: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col max-w-5xl mx-auto w-full" dir="rtl">
      {/* Intro Header */}
      <div className="mb-6 text-right animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className={`text-base font-black tracking-tight ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
              ماژول حقوق و دستمزد
            </h2>
            <button
              onClick={() => setShowFriendlyGuide(!showFriendlyGuide)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center gap-1 hover:bg-indigo-500/20 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              {showFriendlyGuide ? "پنهان‌سازی آموزش ساده" : "آموزش ساده به زبان خودمانی"}
            </button>
          </div>
          <p className={`text-xs mt-1.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"} max-w-2xl leading-relaxed`}>
            محاسبات پیچیده مربوط به کارکنان را تسریع و دقیق می‌کند.
          </p>
        </div>
      </div>

      {/* Friendly Guide Block */}
      {showFriendlyGuide && (
        <div className={`p-5 rounded-2xl border mb-6 transition-all ${
          isDarkMode ? "bg-indigo-950/15 border-indigo-900/40 text-slate-200" : "bg-indigo-50/40 border-indigo-100 text-slate-800"
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                راهنمای خودمونی: «حقوق و دستمزد» به زبان خیلی ساده چیست؟
              </h3>
              <p className="text-xs leading-relaxed opacity-90 mb-4">
                مدیریت منابع انسانی و محاسبه حقوق کارکنان، نیازمند دقت بالا در ورود اطلاعات کارکرد و اعمال قوانین مالیاتی و بیمه‌ای است. این ماژول تمام این موارد را خودکارسازی می‌کند.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 mb-2">۱. محاسبه کارکرد</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    دریافت اطلاعات از دستگاه حضور و غیاب برای محاسبه دقیق ساعت کار.
                  </p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 mb-2">۲. صدور فیش حقوقی</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    محاسبه حقوق و کسورات بر اساس قانون کار و صدور فیش حقوقی آماده چاپ.
                  </p>
                </div>
                <div className={`p-3.5 rounded-xl border ${isDarkMode ? "bg-slate-950/40 border-slate-850" : "bg-white border-slate-100"}`}>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 mb-2">۳. فایل‌های قانونی</span>
                  <p className="text-[11px] leading-relaxed opacity-85">
                    ایجاد خودکار فایل‌های مالیات و بیمه برای ارسال مستقیم به سازمان‌های دولتی.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`p-5 rounded-2xl border text-right transition-all flex flex-col justify-between group h-40 ${
                isDarkMode 
                  ? "bg-[#1E293B] border-slate-800 hover:border-slate-700 hover:bg-slate-800/80" 
                  : "bg-white border-slate-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${sec.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {sec.badge && (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    isDarkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}>
                    {sec.badge}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <h3 className={`font-bold text-[13px] mb-1.5 flex items-center justify-between ${
                  isDarkMode ? "text-slate-100 group-hover:text-blue-400" : "text-slate-800 group-hover:text-blue-600"
                }`}>
                  {sec.title}
                  <ChevronLeft className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className={`text-[10.5px] leading-relaxed line-clamp-2 ${isDarkMode ? "text-slate-500" : "text-slate-500"}`}>
                  {sec.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
