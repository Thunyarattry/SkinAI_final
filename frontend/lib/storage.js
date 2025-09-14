// const KEY = 'skinai_history';

// export function addHistory(item) {
//   const list = getHistory();
//   list.push(item);
//   localStorage.setItem(KEY, JSON.stringify(list));
// }

// export function getHistory() {
//   if (typeof window === 'undefined') return [];
//   try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
// }



// lib/storage.js
const KEY = 'skinai_history';

// ✅ เพิ่มรายการใหม่ลงใน history
export function addHistory(item) {
  if (typeof window === 'undefined') return false;
  
  try {
    const list = getHistory();
    
    // สร้าง history entry ที่สมบูรณ์
    const historyEntry = {
      id: item.id || Date.now().toString(),
      ts: item.ts || new Date().toISOString(),
      image: item.image,
      croppedImage: item.croppedImage,
      severity: item.severity || 'Unknown',
      severityScore: item.severityScore || item.confidence || 0,
      skinCondition: item.skinCondition || 'Unknown',
      skinType: item.skinType || 'Unknown',
      skinTone: item.skinTone || 'Unknown',
      faceDetected: item.faceDetected || false,
      detectionMethod: item.detectionMethod,
      analysisStatus: item.analysisStatus || 'Complete',
      affectedAreas: item.affectedAreas || [],
      metrics: item.metrics || {},
      recommendations: item.recommendations || [],
      treatmentPlan: item.treatmentPlan || {},
      geminiSuccess: item.geminiSuccess || false,
      texture: item.texture,
      confidence: item.confidence || 0,
      // Advanced Analysis fields
      faceDetection: item.faceDetection,
      skinAnalysis: item.skinAnalysis,
      processingTime: item.processingTime,
      analysisMethod: item.analysisMethod || item.skinAnalysis?.analysis_method || 'Standard',
      version: '2.1.0',
      ...item // รวมข้อมูลอื่นๆ ที่ส่งมา
    };
    
    list.push(historyEntry);
    
    // จำกัดจำนวน history ไม่เกิน 100 รายการ
    if (list.length > 100) {
      list.splice(0, list.length - 100);
    }
    
    localStorage.setItem(KEY, JSON.stringify(list));
    return historyEntry;
  } catch (error) {
    console.error('Failed to add history:', error);
    return false;
  }
}

// ✅ ดึงข้อมูล history ทั้งหมด
export function getHistory() {
  if (typeof window === 'undefined') return [];
  
  try {
    const historyStr = localStorage.getItem(KEY);
    if (!historyStr) return [];
    
    const history = JSON.parse(historyStr);
    
    // Backward compatibility - แปลงข้อมูลเก่าให้เข้ากับ format ใหม่
    return history.map(item => ({
      ...item,
      id: item.id || Date.now().toString() + Math.random(),
      ts: item.ts || new Date().toISOString(),
      severity: item.severity || 'Unknown',
      severityScore: item.severityScore || item.confidence || 0,
      image: item.image || item.croppedImage || '/placeholder.jpg',
      faceDetected: item.faceDetected || false,
      analysisMethod: item.analysisMethod || 'Standard'
    }));
  } catch (error) {
    console.error('Failed to get history:', error);
    return [];
  }
}

// ✅ ลบรายการเดี่ยว
export function deleteHistoryItem(id) {
  if (typeof window === 'undefined') return false;
  
  try {
    const list = getHistory();
    const updatedList = list.filter(item => item.id !== id);
    localStorage.setItem(KEY, JSON.stringify(updatedList));
    return true;
  } catch (error) {
    console.error('Failed to delete history item:', error);
    return false;
  }
}

// ✅ ล้าง history ทั้งหมด
export function clearHistory() {
  if (typeof window === 'undefined') return false;
  
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear history:', error);
    return false;
  }
}

// ✅ ค้นหารายการตาม ID
export function getHistoryItem(id) {
  if (typeof window === 'undefined') return null;
  
  try {
    const list = getHistory();
    return list.find(item => item.id === id) || null;
  } catch (error) {
    console.error('Failed to get history item:', error);
    return null;
  }
}

// ✅ อัปเดตรายการ
export function updateHistoryItem(id, updates) {
  if (typeof window === 'undefined') return false;
  
  try {
    const list = getHistory();
    const index = list.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    list[index] = { ...list[index], ...updates };
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error('Failed to update history item:', error);
    return false;
  }
}

// ✅ ดึงสถิติ
export function getHistoryStats() {
  if (typeof window === 'undefined') return null;
  
  try {
    const list = getHistory();
    
    if (list.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        averageScore: 0,
        latestDate: null,
        oldestDate: null
      };
    }
    
    const successful = list.filter(item => item.faceDetected).length;
    const failed = list.length - successful;
    const totalScore = list.reduce((sum, item) => sum + (item.severityScore || 0), 0);
    const averageScore = Math.round(totalScore / list.length);
    
    const dates = list.map(item => new Date(item.ts)).sort((a, b) => a - b);
    const oldestDate = dates[0];
    const latestDate = dates[dates.length - 1];
    
    return {
      total: list.length,
      successful,
      failed,
      averageScore,
      latestDate: latestDate.toISOString(),
      oldestDate: oldestDate.toISOString()
    };
  } catch (error) {
    console.error('Failed to get history stats:', error);
    return null;
  }
}

// ✅ Export ข้อมูลเป็น JSON
export function exportHistoryAsJSON() {
  if (typeof window === 'undefined') return null;
  
  try {
    const list = getHistory();
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '2.1.0',
      totalEntries: list.length,
      data: list
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Failed to export history:', error);
    return null;
  }
}

// ✅ Import ข้อมูลจาก JSON
export function importHistoryFromJSON(jsonString) {
  if (typeof window === 'undefined') return false;
  
  try {
    const importData = JSON.parse(jsonString);
    
    // ตรวจสอบ format
    if (!importData.data || !Array.isArray(importData.data)) {
      throw new Error('Invalid import format');
    }
    
    // Merge กับข้อมูลเดิม
    const existingList = getHistory();
    const newList = [...existingList, ...importData.data];
    
    // ลบ duplicate (ตาม ID)
    const uniqueList = newList.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    localStorage.setItem(KEY, JSON.stringify(uniqueList));
    return true;
  } catch (error) {
    console.error('Failed to import history:', error);
    return false;
  }
}

// ✅ ฟังก์ชันช่วยสำหรับ backward compatibility
export function saveAnalysisToHistory(analysisData, imageUrl) {
  return addHistory({
    ...analysisData,
    image: imageUrl,
    ts: new Date().toISOString()
  });
}

// ✅ ฟังก์ชันช่วยสำหรับลบรายการ
export function deleteAnalysisFromHistory(analysisId) {
  return deleteHistoryItem(analysisId);
}
