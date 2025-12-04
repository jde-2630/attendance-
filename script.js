// Firebase config (from user)
const firebaseConfig = {
  apiKey: "AIzaSyCZu2O_dZG3NrbMNesHcVL6Mc2tm-JT0hQ",
  authDomain: "sample-b492e.firebaseapp.com",
  databaseURL: "https://sample-b492e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sample-b492e",
  storageBucket: "sample-b492e.firebasestorage.app",
  messagingSenderId: "228031625953",
  appId: "1:228031625953:web:9494c5a0511229813f15a0",
  measurementId: "G-N3Q5VT83M7"
};

// Initialize Firebase (v8 namespaced)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DOM elements
const attendanceForm = document.getElementById('attendanceForm');
const submitBtn = document.getElementById('submitBtn');
const recordsBtn = document.getElementById('recordsBtn');
const backToFormBtn = document.getElementById('backToFormBtn');
const backToFormBtn2 = document.getElementById('backToFormBtn2');
const resetBtn = document.getElementById('resetBtn');

const errorMessage = document.getElementById('errorMessage');
const passwordError = document.getElementById('passwordError');

document.getElementById('date').value = new Date().toISOString().split('T')[0];

// Helpers
function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
}

// Wire buttons
submitBtn.addEventListener('click', submitForm);
recordsBtn.addEventListener('click', () => { showSection('recordsSection'); });
backToFormBtn.addEventListener('click', () => { showSection('formSection'); });
backToFormBtn2.addEventListener('click', () => { showSection('formSection'); });
resetBtn.addEventListener('click', resetRecords);
document.getElementById('passwordForm').addEventListener('submit', checkPassword);

// Submit function
function submitForm() {
  const studentName = document.getElementById('studentName').value.trim();
  const gradeLevel = document.getElementById('gradeLevel').value;
  const lrn = document.getElementById('lrn').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const overallAttendance = document.getElementById('overallAttendance').value;
  const date = document.getElementById('date').value;

  if (!studentName || !gradeLevel || !lrn || !subject || !overallAttendance || !date) {
    errorMessage.textContent = "Please fill in all fields.";
    errorMessage.style.display = "block";
    return;
  }

  if (isNaN(lrn)) {
    errorMessage.textContent = "LRN must be a number.";
    errorMessage.style.display = "block";
    return;
  }

  errorMessage.style.display = "none";

  const newRecord = { studentName, gradeLevel, lrn, subject, overallAttendance, date };

  // Push to Firebase
  db.ref('attendance').push(newRecord, (err) => {
    if (err) {
      alert('Failed to save record: ' + err);
    } else {
      attendanceForm.reset();
      document.getElementById('date').value = new Date().toISOString().split('T')[0];
      showSection('submittedSection');
    }
  });
}

// Password checker
function checkPassword(e) {
  e.preventDefault();
  const pwd = document.getElementById('password').value;
  if (pwd === 'jdej') {
    passwordError.style.display = 'none';
    document.getElementById('recordsDisplay').style.display = 'block';
    displayRecords();
  } else {
    passwordError.textContent = 'Incorrect password. Please try again.';
    passwordError.style.display = 'block';
  }
}

// Display records (real-time)
let recordsListener = null;
function displayRecords() {
  const container = document.getElementById('recordsContainer');
  const noRecords = document.getElementById('noRecords');

  // detach previous listener if exists
  if (recordsListener) {
    db.ref('attendance').off('value', recordsListener);
    recordsListener = null;
  }

  recordsListener = function(snapshot) {
    container.innerHTML = '';
    if (!snapshot.exists()) {
      noRecords.style.display = 'block';
      return;
    }
    noRecords.style.display = 'none';

    const groups = {};
    snapshot.forEach(child => {
      const r = child.val();
      if (!groups[r.gradeLevel]) groups[r.gradeLevel] = [];
      groups[r.gradeLevel].push(r);
    });

    for (const grade in groups) {
      const gradeSection = document.createElement('div');
      gradeSection.className = 'grade-section';
      gradeSection.innerHTML = `<h3>${grade} Records</h3>`;

      const table = document.createElement('table');
      table.innerHTML = `
        <thead>
          <tr>
            <th>Student's Name</th>
            <th>LRN</th>
            <th>Subject</th>
            <th>Overall Attendance</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody></tbody>
      `;
      const tbody = table.querySelector('tbody');

      groups[grade].forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${r.studentName}</td>
          <td>${r.lrn}</td>
          <td>${r.subject}</td>
          <td>${r.overallAttendance}</td>
          <td>${r.date}</td>
        `;
        tbody.appendChild(tr);
      });

      gradeSection.appendChild(table);
      container.appendChild(gradeSection);
    }
  };

  db.ref('attendance').on('value', recordsListener);
}

// Reset records
function resetRecords() {
  if (!confirm('Are you sure you want to reset all records? This cannot be undone.')) return;
  db.ref('attendance').remove().then(() => {
    // UI will update via listener
  }).catch(err => alert('Failed to reset: ' + err));
}
