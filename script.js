/*
 * ==================================
 * File: script.js (Frontend Logic)
 * Bản đầy đủ - Cập nhật ngày 23/10/2025
 * Đã sửa lỗi: Lấy ngày/tổ khi Submit ở chế độ Sửa
 * ==================================
 */

const API_URL = "https://script.google.com/macros/s/AKfycbx8oxlRZrgKPzdazP8J8MP5gi1y8TMCdUSyS6UXn6X4AnqAHxrm9QuBFMxx4ktebVmEOA/exec";
let currentUserCode = "";
let currentUserGroups = [];
let currentRecheckTasks = [];
let isEditMode = false;
let currentRecheckKeys = [];
let currentEditGroup = ""; // (MỚI) Lưu tổ đang sửa/recheck
let currentEditDate = "";  // (MỚI) Lưu ngày đang sửa/recheck (YYYY-MM-DD)

// Lấy DOM Elements
const loginSection = document.getElementById('login-section');
const workArea = document.getElementById('work-area');
const welcomeMessageElement = document.getElementById('welcome-message');
const recheckSection = document.getElementById('recheck-section');
const newAttendanceSection = document.getElementById('new-attendance-section');
const employeeListArea = document.getElementById('employee-list-area');
const mainContainer = document.getElementById('main-container');
const messageEl = document.getElementById('message');
const loginButton = document.getElementById('login-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const recheckListContainer = document.getElementById('recheck-list-container');
const recheckCountSpan = document.getElementById('recheck-count');
const newGroupDropdown = document.getElementById('new-group-dropdown');
const newAttendanceDateInput = document.getElementById('new-attendance-date');
const startNewAttendanceBtn = document.getElementById('start-new-attendance-btn');
const employeeListTitle = document.getElementById('employee-list-title');
const employeeTableContainer = document.getElementById('employee-table-container');
const loadingSpinner = document.getElementById('loading-spinner');
const addRowBtn = document.getElementById('add-row-btn');
const submitBtn = document.getElementById('submit-btn');
const backButton = document.getElementById('back-button');


// --- HÀM TÍNH NGÀY ---
function getAttendanceDateString(date = new Date()) {
    // Chỉ trừ ngày nếu là ngày hiện tại và trước 6h sáng
    if (date.getHours() < 6 && arguments.length === 0) {
        date.setDate(date.getDate() - 1);
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // +1 vì tháng từ 0-11
    const year = date.getFullYear();
    // Input type="date" yêu cầu YYYY-MM-DD
    return `${year}-${month}-${day}`;
}

// --- HÀM ĐẶT NGÀY ---
function setAttendanceDate() {
    if (newAttendanceDateInput) { newAttendanceDateInput.value = getAttendanceDateString(); }
    // const editDateInput = document.getElementById('edit-date'); // If using a separate edit date input
    // if (editDateInput) { editDateInput.value = getAttendanceDateString(); }
}

// --- HÀM LOGIN ---
async function handleLogin() {
    const username = usernameInput.value.trim(); const password = passwordInput.value;
    if (!username || !password) {
        messageEl.style.color = "red"; messageEl.innerText = "Vui lòng nhập đủ Mã NV và Mật khẩu.";
        return;
    }
	messageEl.innerText = "";

    loginButton.classList.add('loading');
	
    loginButton.disabled = true; loginButton.innerText = "Đang xử lý...";
    //messageEl.style.color = "blue"; messageEl.innerText = "Đang kết nối...";
    try {
        const response = await fetch(API_URL, {
            method: 'POST', redirect: 'follow',
            body: JSON.stringify({ action: 'login', username: username, password: password }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        if (!response.ok) {
            let errorText = `Lỗi HTTP ${response.status}: ${response.statusText}`;
            try { const errorResult = await response.json(); errorText = errorResult.message || errorText; } catch (e) {}
            throw new Error(errorText);
        }

        const result = await response.json();
        if (result.success) {
            currentUserName = result.name;
            currentUserCode = result.userCode;
            currentUserGroups = result.groups;

            loginSection.style.display = 'none';
            workArea.style.display = 'block';
            mainContainer.style.maxWidth = '600px';

            // Call function to display main dashboard
            displayDashboard();

            // Load recheck list
            loadAndDisplayRecheckList();

        } else {
            throw new Error(result.message || "Sai Mã NV hoặc Mật khẩu.");
        }
    } catch (error) {
        messageEl.style.color = "red";
        messageEl.innerText = `Lỗi đăng nhập: ${error.message}`;
        console.error("Login Fetch Error:", error);
    } finally {
		loginButton.classList.remove('loading');
        loginButton.disabled = false;
        loginButton.innerText = "Đăng Nhập";
    }
}

// --- HÀM HIỂN THỊ DASHBOARD CHÍNH ---
function displayDashboard() {
    // Display name
    if (welcomeMessageElement) {
        welcomeMessageElement.innerHTML = `👋 Xin chào, <strong>${currentUserName || 'Bạn'}</strong>!`; // Use innerHTML for bold
    }

    // Show main sections
    recheckSection.style.display = 'block';
    newAttendanceSection.style.display = 'block';
    employeeListArea.style.display = 'none'; // Hide table
    if(backButton) backButton.style.display = 'none'; // Hide back button

    // Populate new attendance dropdown
    populateNewAttendanceDropdown(currentUserGroups);
    setAttendanceDate(); // Set date

    // Reset edit mode flag if necessary
    isEditMode = false;
}


// --- HÀM TẢI VÀ HIỂN THỊ RECHECK LIST ---
async function loadAndDisplayRecheckList() {
    recheckListContainer.innerHTML = '<p>Đang tải danh sách cần điểm danh lại...</p>';
    recheckCountSpan.innerText = '...';
    try {
        const response = await fetch(API_URL, {
            method: 'POST', redirect: 'follow',
            body: JSON.stringify({ action: 'getRecheckList', userCode: currentUserCode }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        
        if (result.success) {
            const allTasks = result.tasks || []; // Lấy TẤT CẢ task từ backend

            // (MỚI) LỌC PHÂN QUYỀN TẠI ĐÂY
            // Kiểm tra xem 'task.group' có nằm trong danh sách 'currentUserGroups' (lấy lúc login) không
            const authorizedTasks = allTasks.filter(task => currentUserGroups.includes(task.group));

            // (Ghi log để admin/dev biết nếu có task bị ẩn)
            if (allTasks.length > authorizedTasks.length) {
                console.warn("Đã ẩn " + (allTasks.length - authorizedTasks.length) + " task recheck không thuộc nhóm được phép của user.");
            }

            currentRecheckTasks = authorizedTasks; // (MỚI) Gán danh sách ĐÃ LỌC
            displayRecheckTasks(currentRecheckTasks); // (MỚI) Hiển thị danh sách ĐÃ LỌC
        } else { 
            throw new Error(result.message); 
        }
    } catch (error) {
        recheckListContainer.innerHTML = `<p style="color: red;">Lỗi tải danh sách Recheck: ${error.message}</p>`;
        recheckCountSpan.innerText = 'Lỗi';
        console.error("Fetch Recheck Error:", error);
    }
}

// --- HÀM HIỂN THỊ TASK TRONG RECHECK LIST ---
function displayRecheckTasks(tasks) {
    recheckListContainer.innerHTML = '';
    const pendingTasks = tasks.filter(task => task.status !== 'Đã cập nhật');
    recheckCountSpan.innerText = pendingTasks.length;

    if (tasks.length === 0) {
        recheckListContainer.innerHTML = '<p>Không có yêu cầu điểm danh lại nào.</p>';
        return;
    }

    tasks.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'recheck-task-item';
        const isCompleted = task.status === 'Đã cập nhật';
        const statusIcon = isCompleted ? '✅' : '⚠️';
        const actionText = isCompleted ? '[Xem lại]' : '[Điểm danh lại]';
        const dateParts = task.date ? task.date.split('-') : ['??', '??', '??'];
        const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : 'Không rõ ngày';

        taskDiv.innerHTML = `
            <span class="task-icon">🗓️</span> ${displayDate} |
            <span class="task-icon">🏷️</span> ${task.group} |
            <span class="task-icon">${statusIcon}</span> ${task.status}
            <a href="#" class="task-action" data-group="${task.group}" data-date="${task.date}" data-keys="${task.keys || ''}">${actionText}</a>
        `;
        if (isCompleted) { taskDiv.classList.add('completed'); }

        const actionLink = taskDiv.querySelector('.task-action');
        if (actionLink) {
            actionLink.onclick = (e) => {
                e.preventDefault();
                const group = actionLink.getAttribute('data-group');
                const date = actionLink.getAttribute('data-date');
                const keys = actionLink.getAttribute('data-keys'); // Get keys
                if (group && date) { handleStartRecheckOrView(group, date, isCompleted, keys); } // Pass keys
            };
        }
        recheckListContainer.appendChild(taskDiv);
    });
}

// --- (CẬP NHẬT) HÀM BẮT ĐẦU ĐIỂM DANH LẠI HOẶC XEM LẠI ---
function handleStartRecheckOrView(groupName, date, isViewOnly, keysString) { // Add keysString
    isEditMode = true;
    currentRecheckKeys = keysString ? keysString.split(',').map(k => k.trim()).filter(k => k) : []; // Store keys globally
    currentEditGroup = groupName; // (MỚI) Store group being edited
    currentEditDate = date;     // (MỚI) Store date being edited (YYYY-MM-DD)

    const title = `${isViewOnly ? 'Xem lại' : 'Điểm danh lại'}: ${groupName} - Ngày ${date.split('-').reverse().join('/')}`;
    switchToTableView(title);
    loadAttendanceDataForEdit(groupName, date, isViewOnly, currentRecheckKeys); // Pass keys to load function
}

// --- HÀM CHUYỂN SANG GIAO DIỆN BẢNG ---
function switchToTableView(title) {
    mainContainer.style.maxWidth = '900px';
    recheckSection.style.display = 'none';
    newAttendanceSection.style.display = 'none';
    employeeListArea.style.display = 'block';
    employeeListTitle.innerText = title;
    if (backButton) backButton.style.display = 'block';
}

// --- (CẬP NHẬT) HÀM QUAY LẠI DASHBOARD CHÍNH ---
function switchToDashboardView() {
    mainContainer.style.maxWidth = '600px';
    recheckSection.style.display = 'block';
    newAttendanceSection.style.display = 'block';
    employeeListArea.style.display = 'none';
    if (backButton) backButton.style.display = 'none';
    // (MỚI) Clear previous edit info
    currentEditGroup = "";
    currentEditDate = "";
    currentRecheckKeys = [];
    isEditMode = false; // Reset flag

    loadAndDisplayRecheckList(); // Reload recheck list
}

// --- HÀM TẢI DỮ LIỆU ĐỂ SỬA/XEM ---
async function loadAttendanceDataForEdit(groupName, dateToEdit, isViewOnly, recheckKeys = []) { // Add recheckKeys
    const listContainer = employeeTableContainer; const spinner = loadingSpinner;
    const actionButtons = document.querySelector('.table-actions');
    listContainer.innerHTML = ''; spinner.style.display = 'block';
    actionButtons.style.display = 'none';
    try {
        const response = await fetch(API_URL, {
            method: 'POST', redirect: 'follow',
            body: JSON.stringify({ action: 'getAttendanceData', groupName: groupName, date: dateToEdit }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json(); spinner.style.display = 'none';
        if (result.success && result.data.length > 0) {
            // Pass recheckKeys to createEmployeeTable
            createEmployeeTable(result.data, true, isViewOnly, recheckKeys);
            actionButtons.style.display = 'flex';
            if (addRowBtn) addRowBtn.style.display = 'none'; // Always hide Add button when editing/viewing
            if (submitBtn) submitBtn.style.display = isViewOnly ? 'none' : 'block';
        } else { listContainer.innerHTML = `<p style="color: red; text-align: center;">${result.message || 'Không tìm thấy dữ liệu.'}</p>`; }
    } catch (error) { /* ... error handling ... */ }
}

// --- HÀM TẢI DS ĐIỂM DANH MỚI ---
async function loadEmployeeListForNew(groupName) {
    isEditMode = false; currentRecheckKeys = []; // Reset keys
    const attendanceDate = newAttendanceDateInput.value;
    switchToTableView(`Điểm danh mới: ${groupName} - Ngày ${attendanceDate.split('-').reverse().join('/')}`);
    const listContainer = employeeTableContainer; const spinner = loadingSpinner;
    const actionButtons = document.querySelector('.table-actions');
    listContainer.innerHTML = ''; spinner.style.display = 'block'; actionButtons.style.display = 'none';
    try {
        const response = await fetch(API_URL, {
            method: 'POST', redirect: 'follow',
            body: JSON.stringify({ action: 'getEmployees', groupName: groupName }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json(); spinner.style.display = 'none';
        if (result.success) {
            createEmployeeTable(result.data, false, false, []); // Call with empty recheckKeys
            actionButtons.style.display = 'flex';
            if (addRowBtn) addRowBtn.style.display = 'block';
            if (submitBtn) submitBtn.style.display = 'block';
        } else { listContainer.innerHTML = `<p style="color: red; text-align: center;">${result.message}</p>`; }
    } catch (error) { /* ... error handling ... */ }
}

// --- HÀM TẠO BẢNG (Highlight & Disable logic) ---
function createEmployeeTable(employees, isEditing = false, isViewOnly = false, recheckKeys = []) { // Add recheckKeys
    const listContainer = employeeTableContainer; listContainer.innerHTML = '';
    const addRowBtnElement = addRowBtn;

    if (!employees || employees.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center;">Không có nhân viên nào trong dữ liệu này.</p>';
        if (addRowBtnElement) addRowBtnElement.style.display = (isEditing || isViewOnly || !employees || employees.length === 0) ? 'none' : 'block';
        return;
    }
     // Hide Add button if viewing, show otherwise (unless no data)
    if (addRowBtnElement) addRowBtnElement.style.display = isViewOnly ? 'none' : 'block';

    const table = document.createElement('table'); table.className = 'employee-table';
    const thead = document.createElement('thead');
    thead.innerHTML = `<tr><th class="col-stt">STT</th><th class="col-ten">Họ và Tên</th><th class="col-check">Có Làm</th><th class="col-check">Vắng</th><th class="col-ghichu">Ghi Chú</th></tr>`;
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    employees.forEach((emp, index) => {
        const tr = document.createElement('tr');
        const employeeMaNV = emp.maNV || '';
        tr.setAttribute('data-manv', employeeMaNV); tr.setAttribute('data-vitri', emp.viTri || '');
        const radioName = `check_emp_${index}`;
        const presentChecked = isEditing && emp.status === 'present' ? 'checked' : '';
        const absentChecked = isEditing && emp.status === 'absent' ? 'checked' : '';
        const noteValue = isEditing ? (emp.note || '') : '';

        // Disable and Highlight Logic
        const needsRecheck = isEditing && recheckKeys.includes(employeeMaNV);
        const isDisabled = isViewOnly || (isEditing && !needsRecheck);
        const disabledAttr = isDisabled ? 'disabled' : '';
        if (needsRecheck) { tr.classList.add('recheck-highlight'); }

        tr.innerHTML = `
            <td>${emp.stt}</td><td>${emp.hoTen}</td>
            <td class="cell-center"><input type="radio" name="${radioName}" value="present" class="radio-check" ${presentChecked} ${disabledAttr}></td>
            <td class="cell-center"><input type="radio" name="${radioName}" value="absent" class="radio-check" ${absentChecked} ${disabledAttr}></td>
            <td><input type="text" class="notes-input" placeholder="Ghi chú..." value="${noteValue}" ${disabledAttr}></td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    listContainer.appendChild(table);
}

// --- HÀM THÊM DÒNG MỚI ---
function addNewEmployeeRow() {
    let tableBody = document.querySelector(".employee-table tbody");
    if (!tableBody) { /*...*/ createEmployeeTable([]); tableBody = document.querySelector(".employee-table tbody"); }
    const newRowIndex = tableBody.rows.length; const radioName = `check_new_${newRowIndex}`;
    const newRow = document.createElement('tr');
    newRow.setAttribute('data-manv', ''); newRow.setAttribute('data-vitri', '');
    // New rows are never disabled initially
    newRow.innerHTML = `
        <td><input type="text" class="new-row-input" placeholder="STT"></td>
        <td><input type="text" class="new-row-input" placeholder="Họ và tên..."></td>
        <td class="cell-center"><input type="radio" name="${radioName}" value="present" class="radio-check"></td>
        <td class="cell-center"><input type="radio" name="${radioName}" value="absent" class="radio-check"></td>
        <td><input type="text" class="notes-input" placeholder="Ghi chú..."></td>
    `;
    tableBody.appendChild(newRow);
}

// --- (CẬP NHẬT) HÀM GỬI ---
async function handleSubmit() {
    const allRows = document.querySelectorAll(".employee-table tbody tr");
    if (allRows.length === 0) { alert("Không có dữ liệu để gửi."); return; }

    let allValid = true; const dataToSend = [];
    let attendanceDate = ''; let groupName = '';
    const submitButton = submitBtn; const addButton = addRowBtn;

    // Get date and group based on mode (edit or new)
    if (isEditMode) {
        attendanceDate = currentEditDate; // Get from temp variable
        groupName = currentEditGroup;    // Get from temp variable
    } else {
        attendanceDate = newAttendanceDateInput.value;
        groupName = newGroupDropdown.value;
    }

    if (!attendanceDate || !groupName) {
        alert("Không xác định được Ngày hoặc Tổ điểm danh. Vui lòng thử lại.");
        console.error("Lỗi Submit: Không lấy được ngày/tổ.", "isEditMode:", isEditMode, "currentEditDate:", currentEditDate, "currentEditGroup:", currentEditGroup);
        return;
    }

    allRows.forEach(row => { row.classList.remove('row-highlight-error'); });

    // --- Validation (skips disabled rows) ---
    allRows.forEach((row, index) => {
        const isDisabled = row.querySelector('.radio-check:disabled') !== null;
        const stt = row.cells[0].innerText || row.cells[0].querySelector('input')?.value || '';
        const hoTen = row.cells[1].innerText || row.cells[1].querySelector('input')?.value || '';
        const radioName = row.querySelector('.radio-check')?.getAttribute('name');
        const checkedRadio = row.querySelector(`input[name="${radioName}"]:checked`);
        const status = checkedRadio ? checkedRadio.value : (isDisabled ? 'disabled_no_change' : null); // Mark disabled status if needed, else null
        const note = row.cells[4].querySelector('.notes-input').value;
        const maNV = row.getAttribute('data-manv') || '';
        const viTri = row.getAttribute('data-vitri') || '';

        // Only validate if the row is NOT disabled
        if (!isDisabled) {
            let rowHasError = false;
            if (!status) { rowHasError = true; } // Not ticked error
            const hoTenInput = row.cells[1].querySelector('input');
            // Check empty name only if it's a new row (has input) AND status is not already an error
            if (!rowHasError && hoTenInput && !hoTenInput.value.trim()) {
                 rowHasError = true; // New row name empty error
            }
            if (rowHasError) {
                allValid = false;
                row.classList.add('row-highlight-error'); // Highlight error
            }
        }
        // Always add data to send (backend handles overwriting)
        dataToSend.push({ stt, hoTen, maNV, viTri, status, note });
    });


    if (!allValid) {
        alert("Vui lòng kiểm tra lại. Một số dòng cần sửa (có viền đỏ) chưa được tick hoặc chưa nhập Họ Tên.");
        return; // Stop if validation failed on enabled rows
    }

    // --- Gửi dữ liệu ---
    try {
        submitButton.disabled = true; addButton.disabled = true; submitButton.innerText = "Đang gửi...";
        const response = await fetch(API_URL, {
            method: 'POST', redirect: 'follow',
            body: JSON.stringify({
                action: 'submitAttendance', groupName: groupName, date: attendanceDate,
                userName: currentUserName, userCode: currentUserCode,
                isRecheck: isEditMode, // Send isEditMode flag
                data: dataToSend
            }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) {
            alert(result.message || "Đã gửi điểm danh thành công.");
            switchToDashboardView(); // Go back to main dashboard
        } else { throw new Error(result.message); } // Show error from server
    } catch (error) {
        alert("Gửi thất bại! Lỗi: " + error.message);
        console.error("Submit Fetch Error:", error);
		switchToDashboardView();
    } finally {
        submitButton.disabled = false; addButton.disabled = false;
        submitButton.innerText = "Gửi";
    }
}


// --- HÀM ĐIỀN DROPDOWN ĐIỂM DANH MỚI ---
function populateNewAttendanceDropdown(groups) {
    if (!newGroupDropdown) return;
    newGroupDropdown.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = ""; defaultOption.text = "-Chọn tổ-";
    newGroupDropdown.appendChild(defaultOption);
    if (Array.isArray(groups)) {
        groups.forEach(groupName => {
            if (groupName) {
                const option = document.createElement('option');
                option.value = groupName; option.text = groupName;
                newGroupDropdown.appendChild(option);
            }
        });
    } else { console.error("currentUserGroups is not an array:", groups); }
}

// --- GÁN SỰ KIỆN KHI TRANG TẢI XONG ---
document.addEventListener('DOMContentLoaded', (event) => {
    // Don't set date here, set after successful login
    // setAttendanceDate();
    // Assign login events
    if (loginButton) { loginButton.onclick = handleLogin; }
    if (passwordInput) { passwordInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') { handleLogin(); } }); }
    // Assign table button events
    if (addRowBtn) { addRowBtn.onclick = addNewEmployeeRow; }
    if (submitBtn) { submitBtn.onclick = handleSubmit; }
    // Assign new attendance button event
    if (startNewAttendanceBtn) {
        startNewAttendanceBtn.onclick = () => {
             const group = newGroupDropdown.value;
             if (group) { loadEmployeeListForNew(group); } else { alert("Vui lòng chọn tổ."); }
        };
    }
     // Assign back button event
    if (backButton) { backButton.onclick = switchToDashboardView; }

});
