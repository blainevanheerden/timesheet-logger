import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Users, FileText, Calendar, Download, Play, Square, History, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TimesheetLogger() {
  const [technicianName, setTechnicianName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [dailySession, setDailySession] = useState(null);
  const [clockSessions, setClockSessions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [client, setClient] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resolution, setResolution] = useState('');
  const [location, setLocation] = useState('');
  const [showSaveHelp, setShowSaveHelp] = useState(false);
  const [viewMode, setViewMode] = useState('today'); // 'today' or 'history'
  const [historyDate, setHistoryDate] = useState(new Date());

  useEffect(() => {
    const storedTechnician = localStorage.getItem('technicianName');
    const storedLogo = localStorage.getItem('companyLogo');
    const storedSession = localStorage.getItem('dailySession');
    const storedSessions = localStorage.getItem('clockSessions');
    const storedJobs = localStorage.getItem('jobs');
    
    if (storedTechnician) {
      setTechnicianName(storedTechnician);
      setIsLoggedIn(true);
    }
    if (storedLogo) setCompanyLogo(storedLogo);
    if (storedSession) setDailySession(JSON.parse(storedSession));
    if (storedSessions) setClockSessions(JSON.parse(storedSessions));
    if (storedJobs) setJobs(JSON.parse(storedJobs));
  }, []);

  // Persist jobs (including synced state)
  useEffect(() => {
    localStorage.setItem('jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    if (dailySession) {
      localStorage.setItem('dailySession', JSON.stringify(dailySession));
    } else {
      localStorage.removeItem('dailySession');
    }
  }, [dailySession]);

  useEffect(() => {
    localStorage.setItem('clockSessions', JSON.stringify(clockSessions));
  }, [clockSessions]);

  useEffect(() => {
    localStorage.setItem('jobs', JSON.stringify(jobs));
  }, [jobs]);

  const getLocation = async () => {
    // If running inside Capacitor native, use the native Geolocation plugin for better behavior
    try {
      // Dynamic import to avoid bundling Capacitor on web-only builds
      const cap = window.Capacitor;
      if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
        try {
          const { Geolocation } = await import('@capacitor/geolocation');
          setLocation('Requesting native location...');
          // Request runtime permissions explicitly when available (some Capacitor versions provide requestPermissions)
          if (typeof Geolocation.requestPermissions === 'function') {
            try { await Geolocation.requestPermissions(); } catch(e) { console.warn('requestPermissions failed', e); }
          }
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
          const loc = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          setLocation(loc);
          alert(`Location captured (native): ${loc}`);
          return loc;
        } catch (nativeErr) {
          console.warn('Capacitor Geolocation failed, falling back to Navigator API', nativeErr);
        }
      }
    } catch (e) {
      // ignore dynamic import errors and fallback to web geolocation
    }

    if (!navigator.geolocation) {
      setLocation('Geolocation not supported');
      alert('Geolocation is not supported by your browser');
      return null;
    }

    try {
      setLocation('Requesting location...');
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });
      
      const loc = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      setLocation(loc);
      alert(`Location captured: ${loc}`);
      return loc;
    } catch (error) {
      console.error('Location error:', error);
      let errorMsg = 'Location unavailable';
      
      if (error.code === 1) {
        errorMsg = 'Location permission denied';
        alert('Please allow location access in your browser settings');
      } else if (error.code === 2) {
        errorMsg = 'Location unavailable';
        alert('Location information is unavailable');
      } else if (error.code === 3) {
        errorMsg = 'Location timeout';
        alert('Location request timed out');
      }
      
      setLocation(errorMsg);
      return null;
    }
  };

  // Initialize app data folder structure on native platforms
  const initializeAppDataFolder = async () => {
    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        const fs = await new Function('return import("@capacitor/filesystem")')();
        const appDataPath = 'TimeSheetLogger';
        
        // Create main app data folder
        try {
          await fs.Filesystem.mkdir({
            path: appDataPath,
            directory: fs.FilesystemDirectory.Documents,
            recursive: true
          });
        } catch (e) {
          // Folder may already exist, which is fine
        }

        // Create subfolders for different data types
        const subfolders = ['exports', 'backups', 'archive'];
        for (const subfolder of subfolders) {
          try {
            await fs.Filesystem.mkdir({
              path: `${appDataPath}/${subfolder}`,
              directory: fs.FilesystemDirectory.Documents,
              recursive: true
            });
          } catch (e) {
            // Folder may already exist
          }
        }

        console.log('App data folder initialized at Documents/TimeSheetLogger');
        return appDataPath;
      }
    } catch (e) {
      console.warn('Failed to initialize app data folder:', e);
    }
    return null;
  };

  // Initialize app data folder on first load
  useEffect(() => {
    const initFolder = async () => {
      const result = localStorage.getItem('appDataFolderInitialized');
      if (!result) {
        await initializeAppDataFolder();
        localStorage.setItem('appDataFolderInitialized', 'true');
      }
    };
    initFolder();
  }, []);

  const handleLogin = () => {
    if (!loginInput.trim()) {
      window.alert('Please enter your name');
      return;
    }
    setTechnicianName(loginInput.trim());
    setIsLoggedIn(true);
    localStorage.setItem('technicianName', loginInput.trim());
  };

  const handleLogout = () => {
    // Only clear the technician name, keep all other data
    localStorage.removeItem('technicianName');
    setTechnicianName('');
    setIsLoggedIn(false);
    setLoginInput('');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const logoData = reader.result;
        setCompanyLogo(logoData);
        localStorage.setItem('companyLogo', logoData);
      };
      reader.readAsDataURL(file);
    }
  };

  const mainClockIn = () => {
    const now = new Date().toISOString();
    
    if (!dailySession) {
      // First clock in of the day
      setDailySession({
        date: now,
        clockIn: now,
        location: location || 'No location set'
      });
    } else if (dailySession.clockOut) {
      // Clocking back in after being clocked out
      setDailySession({
        ...dailySession,
        clockIn: now,
        clockOut: null,
        location: location || 'No location set'
      });
    }
  };

  const mainClockOut = () => {
    if (!dailySession) return;
    
    const clockOut = new Date();
    const clockIn = new Date(dailySession.clockIn);
    const sessionHours = (clockOut - clockIn) / (1000 * 60 * 60);

    // Save this clock session with current location
    const newSession = {
      id: Date.now(),
      date: dailySession.date,
      clockIn: dailySession.clockIn,
      clockOut: clockOut.toISOString(),
      hours: sessionHours.toFixed(2),
      location: location || dailySession.location
    };
    
    setClockSessions([...clockSessions, newSession]);
    
    // Calculate total hours from all sessions today
    const todayDate = new Date().toDateString();
    const todaySessions = [...clockSessions, newSession].filter(s => 
      new Date(s.date).toDateString() === todayDate
    );
    const totalHours = todaySessions.reduce((sum, s) => sum + parseFloat(s.hours), 0).toFixed(2);

    setDailySession({
      ...dailySession,
      clockOut: clockOut.toISOString(),
      totalHours: totalHours
    });
  };

  const startJob = () => {
    if (!client || !clientPhone || !clientAddress || !clientEmail || !jobDescription) {
      window.alert('Please enter all client details (including email) and job description');
      return;
    }
    if (!dailySession) {
      window.alert('Please clock in for the day first');
      return;
    }
    
    setActiveJob({
      id: Date.now(),
      client,
      clientPhone,
      clientAddress,
      clientEmail,
      jobDescription,
      technician: technicianName,
      startTime: new Date().toISOString(),
      location: location || 'No location set',
      date: dailySession.date,
      afterHours: dailySession.clockOut ? true : false
    });
  };

  const endJob = () => {
    if (!activeJob) return;
    
    if (!resolution) {
      window.alert('Please enter what was done to resolve the issue');
      return;
    }
    
    const endTime = new Date();
    const startTime = new Date(activeJob.startTime);
    const hoursWorked = (endTime - startTime) / (1000 * 60 * 60);
    
    // If job is after hours, all hours count as overtime
    const overtime = activeJob.afterHours 
      ? hoursWorked 
      : calculateOvertime(activeJob.startTime, endTime.toISOString());

    const completedJob = {
      ...activeJob,
      resolution,
      endTime: endTime.toISOString(),
      hoursWorked: hoursWorked.toFixed(2),
      overtime: overtime.toFixed(2),
      location: location || activeJob.location,
      synced: navigator.onLine
    };

    // If offline, mark as unsynced (pending)
    setJobs([...jobs, completedJob]);
    setActiveJob(null);
    setClient('');
    setClientPhone('');
    setClientEmail('');
    setClientAddress('');
    setClientAddress('');
    setJobDescription('');
    setResolution('');
    setLocation('');

    // If online, attempt immediate sync; otherwise will sync when connection returns
    if (navigator.onLine) {
      syncPendingJobs();
    }
  };

  // Delete a job by id
  const deleteJob = (id) => {
    if (!window.confirm('Delete this job?')) return;
    setJobs(jobs.filter(j => j.id !== id));
  };

  // Auto-reset daily session at midnight local time
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight - now;

    const timer = setTimeout(() => {
      setDailySession(null);
    }, msUntilMidnight + 1000); // small buffer

    return () => clearTimeout(timer);
  }, []);

  const calculateOvertime = (timeIn, timeOut) => {
    const standardStart = 8;
    const standardEnd = 17;
    
    const inDate = new Date(timeIn);
    const outDate = new Date(timeOut);
    
    const inHour = inDate.getHours() + inDate.getMinutes() / 60;
    const outHour = outDate.getHours() + outDate.getMinutes() / 60;
    
    let overtime = 0;
    
    if (inHour < standardStart) {
      const earlyStart = Math.min(standardStart - inHour, outHour - inHour);
      overtime += earlyStart;
    }
    
    if (outHour > standardEnd) {
      const lateEnd = Math.max(0, outHour - Math.max(standardEnd, inHour));
      overtime += lateEnd;
    }
    
    return overtime;
  };

  const formatTime = (iso) => {
    return new Date(iso).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTodayJobs = () => {
    const today = new Date().toDateString();
    return jobs.filter(j => new Date(j.startTime).toDateString() === today);
  };

  const getJobsByDate = (date) => {
    const dateStr = date.toDateString();
    return jobs.filter(j => new Date(j.startTime).toDateString() === dateStr);
  };

  const getJobsByMonth = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return jobs.filter(j => {
      const d = new Date(j.startTime);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const getMonthlyOvertime = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return jobs
      .filter(j => {
        const date = new Date(j.startTime);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, j) => sum + parseFloat(j.overtime || 0), 0)
      .toFixed(2);
  };

  const pendingJobsCount = () => jobs.filter(j => !j.synced).length;

  const syncPendingJobs = async () => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const unsynced = jobs.filter(j => !j.synced);
    if (unsynced.length === 0) {
      alert('No pending jobs to sync');
      return;
    }

    try {
      // Try to resolve missing locations first
      const updated = [...jobs];
      for (let i = 0; i < updated.length; i++) {
        const j = updated[i];
        if (!j.synced && (!j.location || j.location === 'No location set')) {
          const loc = await getLocation();
          if (loc) {
            updated[i] = { ...j, location: loc };
          }
        }
      }

      // Send batch to server
      const res = await fetch(`${API}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': (import.meta.env.VITE_SERVER_API_KEY || 'dev-key') },
        body: JSON.stringify(unsynced)
      });

      if (!res.ok) throw new Error('Sync failed');

      // Mark synced locally
      const respJson = await res.json();
      const updatedJobs = jobs.map(j => j.synced ? j : { ...j, synced: true });
      setJobs(updatedJobs);
      alert('Pending jobs synced to server');
    } catch (err) {
      console.error('Sync error', err);
      alert('Failed to sync pending jobs');
    }
  };

  // Auto-sync when connection returns
  useEffect(() => {
    const onOnline = () => {
      if (pendingJobsCount() > 0) syncPendingJobs();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [jobs]);

  // Helper to convert a blob to base64
  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const saveBlobToFile = async (blob, filename) => {
    console.log('saveBlobToFile called with:', { filename, blobSize: blob.size, blobType: blob.type });

    // Check if running on native platform first
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    console.log('Is Native Platform:', isNative);

    // 1) On Native (Android): Use Capacitor Filesystem to save directly to Documents
    if (isNative) {
      try {
        console.log('Attempting to save via Capacitor Filesystem to Documents...');
        const fs = await new Function('return import("@capacitor/filesystem")')();
        const base64 = await blobToBase64(blob);
        console.log('Converted blob to base64, size:', base64.length);
        
        const result = await fs.Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: fs.FilesystemDirectory.Documents,
          recursive: true
        });
        console.log('File saved successfully via Capacitor:', result);
        window.alert(`PDF saved to Documents folder: ${filename}`);
        return true;
      } catch (e) {
        console.error('Capacitor Filesystem save failed:', e);
        throw new Error(`Failed to save to device: ${e.message}`);
      }
    }

    // 2) On Web: Try File System Access API (Chromium)
    try {
      if (window.showSaveFilePicker) {
        console.log('Attempting File System Access API (web save picker)...');
        const opts = {
          suggestedName: filename,
          types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
        };
        const handle = await window.showSaveFilePicker(opts);
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        console.log('File saved via File System Access API');
        return true;
      }
    } catch (e) {
      console.warn('File System Access API not available or failed', e);
    }

    // 3) Fallback: trigger browser download 
    console.log('Using browser download fallback...');
    try {
      const url = URL.createObjectURL(blob);
      console.log('Created blob URL:', url);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      console.log('Clicking anchor to trigger download...');
      a.click();
      // Keep a small delay before cleanup to ensure click is processed
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
        console.log('Download cleanup complete');
      }, 100);
      return true;
    } catch (fallbackErr) {
      console.error('Browser download fallback failed:', fallbackErr);
      throw new Error(`Could not save file: ${fallbackErr.message}`);
    }
  };

  // Save to Downloads / Share flow: On native, save to Documents then optionally share
  const saveBlobToDownloads = async (blob, filename) => {
    console.log('saveBlobToDownloads called with:', { filename, blobSize: blob.size });

    // Native: Save directly to Documents, then offer to share
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      try {
        console.log('Native platform detected, saving to Documents...');
        const fs = await new Function('return import("@capacitor/filesystem")')();
        const base64 = await blobToBase64(blob);
        console.log('Converted to base64');
        
        // Save to Documents
        const saveResult = await fs.Filesystem.writeFile({ 
          path: filename, 
          data: base64, 
          directory: fs.FilesystemDirectory.Documents 
        });
        console.log('File saved to Documents:', saveResult);
        
        // Also save backup to app data folder
        try {
          const backupPath = `TimeSheetLogger/exports/${filename}`;
          await fs.Filesystem.writeFile({ 
            path: backupPath, 
            data: base64, 
            directory: fs.FilesystemDirectory.Documents 
          });
          console.log('Backup copy saved to app data folder');
        } catch (backupErr) {
          console.warn('Failed to save backup copy:', backupErr);
        }
        
        // Now attempt to share
        try {
          console.log('Attempting to share file...');
          const ShareMod = await new Function('return import("@capacitor/share")')();
          const Share = ShareMod && (ShareMod.Share || ShareMod.default) ? (ShareMod.Share || ShareMod.default) : ShareMod;
          
          if (Share && typeof Share.share === 'function') {
            // Try to get file URI
            let fileUri = saveResult.uri || `file://${saveResult.path}`;
            
            // Try to get proper URI from Capacitor if available
            try {
              if (fs.Filesystem && typeof fs.Filesystem.getUri === 'function') {
                const uriRes = await fs.Filesystem.getUri({ 
                  path: filename, 
                  directory: fs.FilesystemDirectory.Documents 
                });
                fileUri = uriRes.uri || fileUri;
                console.log('Got URI from Capacitor:', fileUri);
              }
            } catch (e) {
              console.warn('Could not get URI from Capacitor, using fallback:', e);
            }
            
            console.log('Sharing with URI:', fileUri);
            await Share.share({ 
              title: filename, 
              text: 'Timesheet PDF exported', 
              url: fileUri 
            });
            console.log('Share dialog opened');
            window.alert(`PDF saved to Documents and share dialog opened. File: ${filename}`);
            return true;
          }
        } catch (shareErr) {
          console.warn('Share failed, but file was already saved:', shareErr);
          window.alert(`PDF saved to Documents folder: ${filename}`);
          return true;
        }
      } catch (err) {
        console.error('Native save failed:', err);
        throw new Error(`Failed to save to device: ${err.message}`);
      }
    }

    // Web: fallback to download anchor
    console.log('Web platform detected, using browser download...');
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 100);
      return true;
    } catch (err) {
      console.error('Download fallback failed:', err);
      throw new Error(`Could not download file: ${err.message}`);
    }
  };

  const generatePDF = async () => {
    const todayJobs = getTodayJobs();
    const todayDate = new Date().toDateString();
    const isToday = dailySession && new Date(dailySession.date).toDateString() === todayDate;
    
    if (!isToday && todayJobs.length === 0) {
      window.alert('No timesheet data for today');
      return;
    }

    try {
      // Lazy import to keep initial bundle small
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF();
      const date = new Date().toLocaleDateString();

      doc.setFontSize(14);
      doc.text(`DAILY TIMESHEET - ${date}`, 10, 14);
      doc.setFontSize(11);
      let y = 24;

      doc.text('DAILY CLOCK SESSIONS', 10, y);
      y += 8;

      const todaySessionsList = clockSessions.filter(s => 
        new Date(s.date).toDateString() === todayDate
      );

      if (todaySessionsList.length > 0) {
        todaySessionsList.forEach((session, idx) => {
          doc.text(`Session ${idx + 1}:`, 10, y);
          y += 6;
          doc.text(`Clock In: ${formatTime(session.clockIn)}`, 12, y);
          y += 6;
          doc.text(`Clock Out: ${formatTime(session.clockOut)}`, 12, y);
          y += 6;
          doc.text(`Hours: ${session.hours}`, 12, y);
          y += 6;
          doc.text(`Location: ${session.location}`, 12, y);
          y += 8;

          if (y > 270) { doc.addPage(); y = 20; }
        });
      }

      if (dailySession && !dailySession.clockOut) {
        doc.text('Current Session (Still Active):', 10, y);
        y += 6;
        doc.text(`Clock In: ${formatTime(dailySession.clockIn)}`, 12, y);
        y += 6;
        doc.text(`Location: ${dailySession.location}`, 12, y);
        y += 8;
      }

      if (dailySession && dailySession.totalHours) {
        doc.text(`Total Hours Today: ${dailySession.totalHours}`, 10, y);
        y += 8;
      }

      doc.text('CLIENT JOBS', 10, y);
      y += 8;

      todayJobs.forEach((job, idx) => {
        doc.text(`Job ${idx + 1}${job.afterHours ? ' (AFTER HOURS)' : ''}`, 10, y);
        y += 6;
        doc.text(`Technician: ${job.technician}`, 12, y);
        y += 6;
        doc.text(`Client: ${job.client}`, 12, y);
        y += 6;
        doc.text(`Email: ${job.clientEmail || ''}`, 12, y);
        y += 6;
        doc.text(`Phone: ${job.clientPhone}`, 12, y);
        y += 6;
        doc.text(`Address: ${job.clientAddress}`, 12, y);
        y += 6;
        doc.text(`Job Description: ${job.jobDescription}`, 12, y);
        y += 6;
        doc.text(`Resolution: ${job.resolution}`, 12, y);
        y += 6;
        doc.text(`Start: ${formatTime(job.startTime)}  End: ${formatTime(job.endTime)}`, 12, y);
        y += 6;
        doc.text(`Hours Worked: ${job.hoursWorked}  Overtime: ${job.overtime}`, 12, y);
        y += 10;

        if (y > 270) { doc.addPage(); y = 20; }
      });

      const filename = `timesheet-${date.replace(/\//g, '-')}.pdf`;
      // Create blob and use save helper so users can choose where to save (when supported)
      const blob = doc.output('blob');
      await saveBlobToFile(blob, filename);
      window.alert('PDF generated successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      window.alert('Failed to generate PDF');
    }
  };

  // Generate monthly PDF with overtime summary and job cards
  const createMonthlyPDFBlob = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const now = new Date();
    const month = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    doc.setFontSize(16);
    doc.text(`MONTHLY TIMESHEET - ${month}`, 10, 14);
    doc.setFontSize(12);
    let y = 26;

    const monthJobs = jobs.filter(j => {
      const d = new Date(j.startTime);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalOvertime = monthJobs.reduce((sum, j) => sum + parseFloat(j.overtime || 0), 0).toFixed(2);

    doc.text(`Total Overtime: ${totalOvertime} hrs`, 10, y);
    y += 10;

    doc.text('Overtime Breakdown:', 10, y);
    y += 8;

    monthJobs.forEach((job, idx) => {
      if (parseFloat(job.overtime || 0) > 0) {
        doc.text(`${formatDate(job.startTime)} - ${job.client} - ${job.overtime} hrs (${job.afterHours ? 'After Hours' : 'Normal'})`, 12, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 20; }
      }
    });

    // Add job cards
    doc.addPage();
    doc.setFontSize(14);
    doc.text('JOB CARDS', 10, 14);
    y = 26;

    monthJobs.forEach((job, idx) => {
      doc.setFontSize(12);
      doc.text(`Job ${idx + 1}${job.afterHours ? ' (AFTER HOURS)' : ''}`, 10, y);
      y += 6;
      doc.text(`Date: ${formatDate(job.startTime)}`, 12, y);
      y += 6;
      doc.text(`Client: ${job.client}`, 12, y);
      y += 6;
      doc.text(`Email: ${job.clientEmail || ''}`, 12, y);
      y += 6;
      doc.text(`Phone: ${job.clientPhone}`, 12, y);
      y += 6;
      doc.text(`Address: ${job.clientAddress}`, 12, y);
      y += 6;
      doc.text(`Description: ${job.jobDescription}`, 12, y);
      y += 6;
      doc.text(`Resolution: ${job.resolution || ''}`, 12, y);
      y += 6;
      doc.text(`Hours: ${job.hoursWorked || ''} Overtime: ${job.overtime || '0.00'}`, 12, y);
      y += 10;

      if (y > 270) { doc.addPage(); y = 20; }
    });

    const filename = `timesheet-month-${now.getFullYear()}-${now.getMonth() + 1}.pdf`;
    const blob = doc.output('blob');
    console.log('Monthly PDF created:', { filename, blobSize: blob.size, blobType: blob.type, jobCount: monthJobs.length });
    return { blob, filename };
  };

  const generateMonthlyPDF = async () => {
    const monthJobs = getJobsByMonth(new Date());
    console.log('generateMonthlyPDF called with', monthJobs.length, 'jobs');
    if (monthJobs.length === 0) {
      window.alert('No jobs found for this month. Please complete some jobs first.');
      return;
    }
    try {
      const { blob, filename } = await createMonthlyPDFBlob();
      console.log('About to save blob...');
      await saveBlobToFile(blob, filename);
      console.log('saveBlobToFile completed successfully');
      window.alert('Monthly PDF generated successfully!');
    } catch (err) {
      console.error('Monthly PDF error', err);
      window.alert(`Failed to generate monthly PDF: ${err.message}`);
    }
  };

  const generateMonthlyPDFAndShare = async () => {
    const monthJobs = getJobsByMonth(new Date());
    if (monthJobs.length === 0) {
      window.alert('No jobs found for this month. Please complete some jobs first.');
      return;
    }
    try {
      const { blob, filename } = await createMonthlyPDFBlob();
      await saveBlobToDownloads(blob, filename);
      window.alert('Monthly PDF shared / downloaded successfully!');
    } catch (err) {
      console.error('Monthly PDF share error', err);
      window.alert(`Failed to share/download monthly PDF: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {!isLoggedIn ? (
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              {companyLogo ? (
                <img src={companyLogo} alt="Company Logo" className="h-20 mx-auto mb-4 object-contain" />
              ) : (
                <Clock className="text-indigo-600 mx-auto mb-4" size={64} />
              )}
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Timesheet Logger</h1>
              <p className="text-gray-600">Enter your name to get started</p>
            </div>
            <input
              type="text"
              placeholder="Your Name"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full p-4 rounded-lg border-2 border-gray-200 mb-4 text-lg focus:border-indigo-500 focus:outline-none"
            />
            <button
              onClick={handleLogin}
              className="w-full py-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition text-lg"
            >
              Login
            </button>
            {!companyLogo && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm text-gray-600 mb-2">Upload Company Logo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                {companyLogo && (
                  <img src={companyLogo} alt="Company Logo" className="h-12 object-contain" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                      {!companyLogo && <Clock className="text-indigo-600" />}
                      Timesheet Logger
                    </h1>
                    <div className="ml-4 text-sm text-gray-500">
                      <span>Pending syncs: </span>
                      <span className="font-semibold text-red-600">{pendingJobsCount()}</span>
                    </div>
                    <button
                      onClick={syncPendingJobs}
                      className="ml-4 px-3 py-1 bg-indigo-600 text-white rounded-md text-sm"
                    >
                      Sync Now
                    </button>
                  </div>
                  <p className="text-gray-600 mt-1">Technician: <span className="font-semibold">{technicianName}</span></p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
              >
                Logout
              </button>
            </div>

          {/* Main Daily Clock In/Out */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock size={24} />
              Daily Clock
            </h2>
            {!dailySession ? (
              <div>
                <p className="mb-4">Start your workday</p>
                <button
                  onClick={mainClockIn}
                  className="w-full py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Clock In for Day
                </button>
              </div>
            ) : !dailySession.clockOut ? (
              <div>
                <p className="mb-2"><strong>Clocked In:</strong> {formatTime(dailySession.clockIn)}</p>
                <p className="mb-4"><strong>Location:</strong> {dailySession.location}</p>
                <button
                  onClick={mainClockOut}
                  className="w-full py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Clock Out
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-1"><strong>Last Clock Out:</strong> {formatTime(dailySession.clockOut)}</p>
                <p className="mb-1"><strong>Total Hours Today:</strong> {dailySession.totalHours}</p>
                <p className="mb-4 text-sm bg-white bg-opacity-20 p-3 rounded-lg">
                  Currently clocked out. You can clock back in to continue your workday.
                </p>
                <button
                  onClick={mainClockIn}
                  className="w-full py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Clock Back In
                </button>
              </div>
            )}
          </div>

          {/* Client Job Tracking */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users size={24} />
              Client Job
            </h2>
            {!activeJob ? (
              <div>
                <input
                  type="text"
                  placeholder="Client Name"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full p-3 rounded-lg text-gray-800 mb-3"
                />
                <input
                  type="tel"
                  placeholder="Client Phone Number"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full p-3 rounded-lg text-gray-800 mb-3"
                />
                <input
                  type="text"
                  placeholder="Client Address"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full p-3 rounded-lg text-gray-800 mb-3"
                />
                <input
                  type="email"
                  placeholder="Client Email Address"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full p-3 rounded-lg text-gray-800 mb-3"
                />
                <textarea
                  placeholder="Job Description / Call Out Reason"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full p-3 rounded-lg text-gray-800 mb-3 h-20 resize-none"
                />
                <button
                  onClick={getLocation}
                  className="flex items-center gap-2 px-4 py-3 mb-3 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition w-full justify-center"
                >
                  <MapPin size={20} />
                  Get Location
                </button>
                {location && <p className="text-sm mb-3">📍 {location}</p>}
                <button
                  onClick={startJob}
                  className="w-full py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Start Job
                </button>
              </div>
            ) : (
              <div>
                <p className="mb-1"><strong>Client:</strong> {activeJob.client}</p>
                <p className="mb-1"><strong>Phone:</strong> {activeJob.clientPhone}</p>
                <p className="mb-1"><strong>Address:</strong> {activeJob.clientAddress}</p>
                <p className="mb-1"><strong>Description:</strong> {activeJob.jobDescription}</p>
                <p className="mb-1"><strong>Started:</strong> {formatTime(activeJob.startTime)}</p>
                <p className="mb-4"><strong>Location:</strong> {activeJob.location}</p>
                <textarea
                  placeholder="What was done to resolve the issue?"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full p-3 rounded-lg text-gray-800 mb-3 h-24 resize-none"
                />
                <button
                  onClick={endJob}
                  className="w-full py-3 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
                >
                  <Square size={20} />
                  End Job
                </button>
              </div>
            )}
          </div>

          {/* Monthly Overtime */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-amber-600" />
                <span className="font-semibold text-gray-700">Monthly Overtime</span>
              </div>
              <span className="text-2xl font-bold text-amber-600">{getMonthlyOvertime()} hrs</span>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <strong>Overtime breakdown:</strong>
              <ul className="mt-2 list-disc list-inside">
                {jobs
                  .filter(j => (new Date(j.startTime)).getMonth() === (new Date()).getMonth())
                  .filter(j => parseFloat(j.overtime || 0) > 0)
                  .map(j => (
                    <li key={j.id}>{`${formatDate(j.startTime)} — ${j.client} — ${j.overtime} hrs (${j.afterHours ? 'After Hours' : 'Normal'})`}</li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Export Button */}
          <div className="space-y-3 mb-3">
            <div className="flex items-start gap-3">
              <button
                onClick={generatePDF}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Export Today's Timesheet
              </button>
              <button
                onClick={() => setShowSaveHelp(true)}
                aria-label="How saving works"
                title="How saving works"
                className="p-2 rounded-md bg-white bg-opacity-20 hover:bg-opacity-30 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-help-circle"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2.5-3 4"></path><line x1="12" y1="17" x2="12" y2="17"></line></svg>
              </button>
            </div>

            <div className="flex items-start gap-3">
              <button
                onClick={generateMonthlyPDF}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Export Month's Timesheets & Job Cards
              </button>
              <button
                onClick={generateMonthlyPDFAndShare}
                className="px-4 py-3 bg-white text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-50 transition flex items-center gap-2"
                title="Save to Downloads or use system Share"
              >
                <Download size={18} />
                Save to Downloads / Share
              </button>
            </div>
            <div className="text-sm text-gray-600 mt-2">Tip: in Chromium-based browsers you may be prompted to choose the save location; on mobile you can use the system Share to save to Downloads.</div>
          </div>

          {/* Save help modal */}
          {showSaveHelp && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg max-w-lg w-full p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold">How saving works</h3>
                  <button onClick={() => setShowSaveHelp(false)} aria-label="Close help" className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div className="mt-4 text-sm text-gray-700 space-y-2">
                  <p>When you export a PDF, the app will try the following (in order):</p>
                  <ul className="list-disc list-inside">
                    <li><strong>Desktop Chromium:</strong> you will be prompted to choose a save location (Save File Picker).</li>
                    <li><strong>Native (Capacitor):</strong> the file is written to the app Documents folder and can be shared.</li>
                    <li><strong>Fallback:</strong> the browser will start a normal download to your default downloads folder.</li>
                  </ul>
                  <p>If your browser does not support choosing a location, check your browser download settings or use a Chromium-based browser that supports the File System Access API.</p>
                  <p className="mt-2"><strong>Android / Native:</strong> the app will request location permission when you attempt to capture location — please allow it. When available, the <strong>Save to Downloads / Share</strong> button will open the system share dialog allowing you to save or send the file (no browser download). The app writes exported PDFs to the app's Documents folder by default (no extra permission required). On some Android versions additional storage permissions may be required to save files to shared directories.</p>
                </div>
                <div className="mt-4 text-right">
                  <button onClick={() => setShowSaveHelp(false)} className="px-4 py-2 bg-indigo-600 text-white rounded">Got it</button>
                </div>
              </div>
            </div>
          )}

          {/* Job View Toggle and Display */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setViewMode('today')}
                className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                  viewMode === 'today'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <Clock size={18} />
                Today
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                  viewMode === 'history'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <History size={18} />
                History
              </button>
            </div>

            {viewMode === 'today' ? (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Today's Jobs</h3>
                {getTodayJobs().length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No jobs completed today</p>
                ) : (
                  <div className="space-y-3">
                    {getTodayJobs().map((job) => (
                      <div key={job.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="text-indigo-600" size={18} />
                            <span className="font-semibold text-gray-800">{job.client}</span>
                            {job.afterHours && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
                                After Hours
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{formatDate(job.startTime)}</span>
                            <button
                              onClick={() => deleteJob(job.id)}
                              className="text-sm text-red-600 font-semibold ml-3 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="text-sm mb-2">
                          <p className="text-gray-600">📞 {job.clientPhone}</p>
                          <p className="text-gray-600">📍 {job.clientAddress}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded mb-2 text-sm">
                          <p className="font-semibold text-gray-700 mb-1">Job Description:</p>
                          <p className="text-gray-600">{job.jobDescription}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded mb-2 text-sm">
                          <p className="font-semibold text-gray-700 mb-1">Resolution:</p>
                          <p className="text-gray-600">{job.resolution}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <span className="text-gray-600">Start:</span> {formatTime(job.startTime)}
                          </div>
                          <div>
                            <span className="text-gray-600">End:</span> {formatTime(job.endTime)}
                          </div>
                          <div>
                            <span className="text-gray-600">Hours:</span> {job.hoursWorked}
                          </div>
                          <div className="text-amber-600 font-semibold">
                            <span className="text-gray-600">OT:</span> {job.overtime}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <MapPin size={12} />
                          {job.location}
                        </div>
                        <div className="text-sm text-indigo-600 font-semibold border-t pt-2">
                          👤 Technician: {job.technician}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Job History</h3>
                
                {/* Date Navigation */}
                <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg border border-gray-200">
                  <button
                    onClick={() => setHistoryDate(new Date(historyDate.getTime() - 24 * 60 * 60 * 1000))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronLeft size={20} className="text-gray-600" />
                  </button>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Viewing:</p>
                    <p className="text-lg font-semibold text-gray-800">{formatDate(historyDate)}</p>
                  </div>
                  <button
                    onClick={() => setHistoryDate(new Date(historyDate.getTime() + 24 * 60 * 60 * 1000))}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronRight size={20} className="text-gray-600" />
                  </button>
                </div>

                {/* History Jobs Display */}
                {getJobsByDate(historyDate).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No jobs found for {formatDate(historyDate)}</p>
                ) : (
                  <div className="space-y-3">
                    {getJobsByDate(historyDate).map((job) => (
                      <div key={job.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="text-indigo-600" size={18} />
                            <span className="font-semibold text-gray-800">{job.client}</span>
                            {job.afterHours && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
                                After Hours
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{formatDate(job.startTime)}</span>
                            <button
                              onClick={() => deleteJob(job.id)}
                              className="text-sm text-red-600 font-semibold ml-3 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="text-sm mb-2">
                          <p className="text-gray-600">📞 {job.clientPhone}</p>
                          <p className="text-gray-600">📧 {job.clientEmail || 'No email'}</p>
                          <p className="text-gray-600">📍 {job.clientAddress}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded mb-2 text-sm">
                          <p className="font-semibold text-gray-700 mb-1">Job Description:</p>
                          <p className="text-gray-600">{job.jobDescription}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded mb-2 text-sm">
                          <p className="font-semibold text-gray-700 mb-1">Resolution:</p>
                          <p className="text-gray-600">{job.resolution}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <span className="text-gray-600">Start:</span> {formatTime(job.startTime)}
                          </div>
                          <div>
                            <span className="text-gray-600">End:</span> {formatTime(job.endTime)}
                          </div>
                          <div>
                            <span className="text-gray-600">Hours:</span> {job.hoursWorked}
                          </div>
                          <div className="text-amber-600 font-semibold">
                            <span className="text-gray-600">OT:</span> {job.overtime}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                          <MapPin size={12} />
                          {job.location}
                        </div>
                        <div className="text-sm text-indigo-600 font-semibold border-t pt-2">
                          👤 Technician: {job.technician}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
