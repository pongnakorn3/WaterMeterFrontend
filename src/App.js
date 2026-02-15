import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';

// ✅ Config
const API_BASE_URL = 'https://watermeterbackend-production.up.railway.app';

function App() {
  const [user, setUser] = useState(null);
  const [readings, setReadings] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [newTenant, setNewTenant] = useState({ name: '', room_number: '', student_id: '' });
  
  // ✅ เพิ่ม State สำหรับเลือกเดือนกลับมา (Default เป็นเดือนปัจจุบัน)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const [rates, setRates] = useState({ water: 17, electric: 7 });

  // --- Effects ---
  useEffect(() => {
    if (user) {
        fetchReadings();
        fetchTenants(); 
    }
  }, [user]);

  // --- API Calls ---
  const fetchReadings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/readings`);
      setReadings(res.data);
    } catch (error) { console.error("Error:", error); }
  };

  const fetchTenants = async (query = '') => {
    try {
      const url = query ? `${API_BASE_URL}/api/tenants?search=${query}` : `${API_BASE_URL}/api/tenants`;
      const res = await axios.get(url);
      setTenants(res.data);
    } catch (error) { console.error("Error fetching tenants:", error); }
  };

  const handleAddTenant = async () => {
    if(!newTenant.name || !newTenant.room_number) return alert("กรุณากรอกข้อมูลให้ครบ");
    try {
        await axios.post(`${API_BASE_URL}/api/tenants`, newTenant);
        setNewTenant({ name: '', room_number: '', student_id: '' });
        fetchTenants(); 
    } catch (error) { alert("เพิ่มไม่สำเร็จ หรือห้องซ้ำ"); }
  };

  const handleDeleteTenant = async (id) => {
    if(!window.confirm("ยืนยันที่จะลบรายชื่อนี้?")) return;
    try {
        await axios.delete(`${API_BASE_URL}/api/tenants/${id}`);
        fetchTenants(); 
    } catch (error) { alert("ลบไม่สำเร็จ"); }
  };

  // --- Logic ---
  const filteredReadings = readings.filter(item => {
    // ✅ กรองตามเดือนที่เลือก
    const matchMonth = !selectedMonth || (item.created_at && item.created_at.startsWith(selectedMonth));
    
    const term = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || 
                        (item.room_number && item.room_number.toLowerCase().includes(term)) ||
                        (item.tenant_names && item.tenant_names.toLowerCase().includes(term));
    return matchMonth && matchSearch;
  });

  const handleExport = () => {
    if (filteredReadings.length === 0) return alert("ไม่มีข้อมูล");
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "วันที่,ห้อง,รหัสนักศึกษา,ผู้เช่า,ประเภท,เลขมิเตอร์,หน่วยที่ใช้,ยอดเงิน\n";
    filteredReadings.forEach(item => {
        const unitPrice = item.meter_type === 'water' ? rates.water : rates.electric;
        const totalPrice = (item.usage || 0) * unitPrice;
        const prevReading = item.previous_reading ? item.previous_reading : (item.reading_value - (item.usage || 0));
        
        const row = [
            `"${new Date(item.created_at).toLocaleDateString('th-TH')}"`, 
            `"${item.room_number}"`,
            `"${item.student_ids || '-'}"`,
            `"${item.tenant_names || '-'}"`,
            `"${item.meter_type === 'water' ? 'ประปา' : 'ไฟฟ้า'}"`,
            `"${prevReading} - ${item.reading_value}"`,
            item.usage,
            totalPrice
        ].join(",");
        csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (!user) return <Login onLoginSuccess={(userData) => setUser(userData)} />;

  // --- Styles ---
  const styles = {
    container: { backgroundColor: '#F8F9FA', minHeight: '100vh', fontFamily: "'Sarabun', sans-serif", padding: '20px 40px' },
    
    headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' },
    logoText: { color: '#1a237e', fontWeight: 'bold', fontSize: '24px', margin: 0 },
    subLogoText: { color: '#555', fontSize: '14px', margin: 0 },
    logoutBtn: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' },

    controlCard: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    titleGroup: { display: 'flex', flexDirection: 'column' },
    mainTitle: { fontSize: '20px', fontWeight: 'bold', color: '#333', margin: 0 },
    subTitle: { fontSize: '14px', color: '#777', margin: '5px 0' },
    rateInput: { width: '50px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '4px', padding: '2px', marginLeft: '5px', marginRight: '15px' },
    
    // Inputs & Buttons
    dateInput: { padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginRight: '10px', cursor: 'pointer', color: '#333' },
    btnSearch: { padding: '8px 15px', border: '1px solid #ddd', borderRadius: '4px', marginRight: '10px', width: '200px' },
    btnRefresh: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', marginRight: '10px', display: 'flex', alignItems: 'center', gap: '5px' },
    btnExport: { backgroundColor: '#0056b3', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },

    sectionContainer: { display: 'flex', gap: '20px', marginBottom: '20px' },
    card: { flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    cardTitle: { fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#333' },
    inputGroup: { display: 'flex', gap: '15px', marginBottom: '15px' },
    input: { flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' },
    btnAdd: { backgroundColor: '#1e5ca7', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },

    tenantTable: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '10px', color: '#777', fontSize: '14px', fontWeight: 'normal', borderBottom: '1px solid #eee' },
    td: { padding: '12px 10px', fontSize: '14px', color: '#333', borderBottom: '1px solid #f9f9f9' },
    btnDelete: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' },

    mainTableContainer: { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' },
    mainTable: { width: '100%', borderCollapse: 'collapse' },
    mainTh: { backgroundColor: '#f1f3f5', padding: '15px', textAlign: 'left', color: '#666', fontSize: '14px', fontWeight: 'bold' },
    mainTd: { padding: '15px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#333' },
    
    // ✅ สไตล์สำหรับรูปภาพ
    imgThumbnail: { width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd', cursor: 'zoom-in' }
  };

  return (
    <div style={styles.container}>
      
      {/* 1. Header & Logo */}
      <div style={styles.headerContainer}>
        <div>
           <h1 style={styles.logoText}>NORTH BANGKOK UNIVERSITY</h1>
           <p style={styles.subLogoText}>ระบบจัดการหอพักมหาวิทยาลัยนอร์ทกรุงเทพ สะพานใหม่</p>
        </div>
        <div style={{ textAlign: 'right' }}>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                 <span>👤 {user?.name || user?.username}</span>
                 <button onClick={() => setUser(null)} style={styles.logoutBtn}>ออกจากระบบ</button>
            </div>
        </div>
      </div>

      {/* 2. Top Controls (Rates, Date, Search) */}
      <div style={styles.controlCard}>
         <div style={styles.titleGroup}>
            <h2 style={styles.mainTitle}>จดมิเตอร์ค่าน้ำและค่าไฟหอพัก</h2>
            <p style={styles.subTitle}>ระบบจดมิเตอร์ค่าน้ำและไฟ</p>
            <div style={{marginTop: '5px', fontSize: '14px', color: '#555'}}>
                ค่าน้ำ <input type="number" value={rates.water} onChange={e=>setRates({...rates, water: e.target.value})} style={styles.rateInput} /> บาท
                ค่าไฟ <input type="number" value={rates.electric} onChange={e=>setRates({...rates, electric: e.target.value})} style={styles.rateInput} /> บาท
            </div>
         </div>
         <div style={{ display: 'flex', alignItems: 'center' }}>
            <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={styles.dateInput}
            />
            <input 
                type="text" 
                placeholder="🔍 ค้นหา" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.btnSearch} 
            />
            <button style={styles.btnRefresh} onClick={fetchReadings}>🔄 รีเฟรช</button>
            <button style={styles.btnExport} onClick={handleExport}>🖨️ ส่งออก</button>
         </div>
      </div>

      {/* 3. Tenant Management */}
      <div style={styles.sectionContainer}>
        <div style={styles.card}>
            <h3 style={styles.cardTitle}>เพิ่มผู้เช่า</h3>
            <div style={styles.inputGroup}>
                <input placeholder="เลขห้อง" value={newTenant.room_number} onChange={e=>setNewTenant({...newTenant, room_number: e.target.value})} style={styles.input} />
                <input placeholder="รหัสนักศึกษา" value={newTenant.student_id} onChange={e=>setNewTenant({...newTenant, student_id: e.target.value})} style={styles.input} />
            </div>
            <div style={styles.inputGroup}>
                <input placeholder="ชื่อ-นามสกุล" value={newTenant.name} onChange={e=>setNewTenant({...newTenant, name: e.target.value})} style={styles.input} />
                <button style={styles.btnAdd} onClick={handleAddTenant}>เพิ่ม</button>
            </div>
        </div>

        <div style={styles.card}>
            <h3 style={styles.cardTitle}>รายชื่อ</h3>
            <div style={{maxHeight: '150px', overflowY: 'auto'}}>
            <table style={styles.tenantTable}>
                <thead>
                    <tr>
                        <th style={styles.th}>ห้อง</th>
                        <th style={styles.th}>รหัสนักศึกษา</th>
                        <th style={styles.th}>ชื่อ-นามสกุล</th>
                        <th style={styles.th}></th>
                    </tr>
                </thead>
                <tbody>
                    {tenants.map(t => (
                        <tr key={t.id}>
                            <td style={styles.td}>{t.room_number}</td>
                            <td style={styles.td}>{t.student_id}</td>
                            <td style={styles.td}>{t.name}</td>
                            <td style={{...styles.td, textAlign: 'right'}}>
                                <button style={styles.btnDelete} onClick={() => handleDeleteTenant(t.id)}>ลบ</button>
                            </td>
                        </tr>
                    ))}
                    {tenants.length === 0 && <tr><td colSpan="4" style={{textAlign:'center', padding:'20px', color:'#999'}}>ไม่พบข้อมูล</td></tr>}
                </tbody>
            </table>
            </div>
        </div>
      </div>

      {/* 4. Main Table */}
      <div style={styles.mainTableContainer}>
         <table style={styles.mainTable}>
            <thead>
                <tr>
                    <th style={styles.mainTh}>วันที่</th>
                    <th style={styles.mainTh}>ห้อง</th>
                    <th style={styles.mainTh}>รหัสนักศึกษา</th>
                    <th style={styles.mainTh}>ผู้เช่า</th>
                    <th style={styles.mainTh}>ประเภท</th>
                    <th style={styles.mainTh}>เลขมิเตอร์</th>
                    <th style={{...styles.mainTh, textAlign: 'center'}}>หน่วยที่ใช้</th>
                    <th style={{...styles.mainTh, textAlign: 'right'}}>ยอดรวม</th>
                    <th style={{...styles.mainTh, textAlign: 'right'}}>ยอดหาร</th>
                    <th style={{...styles.mainTh, textAlign: 'center'}}>ผู้จด</th>
                    {/* ✅ เพิ่มหัวตาราง รูปภาพ */}
                    <th style={{...styles.mainTh, textAlign: 'center'}}>รูปภาพ</th>
                </tr>
            </thead>
            <tbody>
                {filteredReadings.map((item, index) => {
                    const unitPrice = item.meter_type === 'water' ? rates.water : rates.electric;
                    const totalPrice = (item.usage || 0) * unitPrice;
                    const perPerson = item.tenant_count > 0 ? totalPrice / item.tenant_count : totalPrice;
                    const prevReading = item.previous_reading ? item.previous_reading : (item.reading_value - (item.usage || 0));
                    
                    const typeColor = item.meter_type === 'water' ? '#448AFF' : '#FFAB00';
                    const typeText = item.meter_type === 'water' ? 'ประปา' : 'ไฟฟ้า';
                    const bgStyle = { backgroundColor: index % 2 === 0 ? '#fafafa' : 'white' };

                    return (
                        <tr key={index} style={bgStyle}>
                            <td style={styles.mainTd}>{new Date(item.created_at).toLocaleDateString('th-TH')}</td>
                            <td style={{...styles.mainTd, fontWeight: 'bold'}}>{item.room_number}</td>
                            <td style={styles.mainTd}>{item.student_ids || '-'}</td>
                            <td style={styles.mainTd}>{item.tenant_names || '-'}</td>
                            <td style={{...styles.mainTd, color: typeColor, fontWeight: 'bold'}}>{typeText}</td>
                            <td style={styles.mainTd}>{prevReading} - {item.reading_value}</td>
                            <td style={{...styles.mainTd, textAlign: 'center', color: '#28a745', fontWeight: 'bold'}}>+{item.usage}</td>
                            <td style={{...styles.mainTd, textAlign: 'right'}}>{totalPrice.toLocaleString()}</td>
                            <td style={{...styles.mainTd, textAlign: 'right'}}>{Math.ceil(perPerson).toLocaleString()}</td>
                            <td style={{...styles.mainTd, textAlign: 'center', color: '#888'}}>{item.recorder_name || '-'}</td>
                            
                            {/* ✅ คอลัมน์แสดงรูปภาพ */}
                            <td style={{...styles.mainTd, textAlign: 'center'}}>
                                {item.image_url ? (
                                    <a href={`${API_BASE_URL}/${item.image_url}`} target="_blank" rel="noopener noreferrer" title="คลิกเพื่อดูรูปใหญ่">
                                        <img src={`${API_BASE_URL}/${item.image_url}`} alt="meter" style={styles.imgThumbnail} />
                                    </a>
                                ) : (
                                    <span style={{color: '#ccc'}}>-</span>
                                )}
                            </td>
                        </tr>
                    );
                })}
                {/* ✅ เปลี่ยน colSpan เป็น 11 เพราะเราเพิ่มคอลัมน์รูปภาพมา */}
                {filteredReadings.length === 0 && (
                    <tr><td colSpan="11" style={{textAlign:'center', padding:'30px', color:'#999'}}>ไม่พบข้อมูลมิเตอร์เดือน {selectedMonth}</td></tr>
                )}
            </tbody>
         </table>
      </div>

    </div>
  );
}

export default App;