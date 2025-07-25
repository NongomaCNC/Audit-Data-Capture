document.addEventListener('DOMContentLoaded', () => {
    const dbName = 'DataStorageDB';
    const storeName = 'formData';
    let db;

    // IndexedDB initialization
    const request = indexedDB.open(dbName, 1);

    request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.errorCode);
        showMessage('Failed to open database.', 'error');
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        // Create an object store with auto-incrementing keys
        const objectStore = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        // You can add indexes here if needed, for example:
        // objectStore.createIndex('name', 'name', { unique: false });
        console.log('Object store created successfully.');
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        console.log('Database opened successfully.');
        // Optionally display existing data when the page loads
        displaySavedData();
    };

    // --- Helper Functions ---

    function showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`; // Add type class for styling (e.g., 'success', 'error', 'info')
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000); // Hide after 3 seconds
    }

    async function addRecord(record) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.add(record);

            request.onsuccess = () => {
                showMessage('Record saved successfully!', 'success');
                resolve();
            };

            request.onerror = (event) => {
                showMessage(`Error saving record: ${event.target.error}`, 'error');
                console.error('Add record error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async function updateRecord(record) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.put(record); // put() updates if key exists, adds if not

            request.onsuccess = () => {
                showMessage('Record updated successfully!', 'success');
                resolve();
            };

            request.onerror = (event) => {
                showMessage(`Error updating record: ${event.target.error}`, 'error');
                console.error('Update record error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async function getRecordById(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.get(id); // Use the provided ID

            request.onsuccess = () => {
                resolve(request.result); // Returns the record or undefined if not found
            };

            request.onerror = (event) => {
                showMessage(`Error retrieving record: ${event.target.error}`, 'error');
                console.error('Get record by ID error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async function deleteRecord(id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event) => {
                showMessage(`Error deleting record: ${event.target.error}`, 'error');
                console.error('Delete record error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async function getAllRecords() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                showMessage(`Error retrieving all records: ${event.target.error}`, 'error');
                console.error('Get all records error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async function clearAllRecords() {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.clear();

            request.onsuccess = () => {
                showMessage('All records cleared successfully.', 'success');
                resolve();
            };

            request.onerror = (event) => {
                showMessage(`Error clearing all records: ${event.target.error}`, 'error');
                console.error('Clear all records error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    function populateFormForEdit(record) {
        document.getElementById('recordId').value = record.id;
        document.getElementById('name').value = record.name;
        document.getElementById('email').value = record.email;
        document.getElementById('messageText').value = record.message;
        document.getElementById('submitBtn').textContent = 'Update Record'; // Change button text
        showMessage('Record loaded for editing.', 'info');
    }

    function clearForm() {
        document.getElementById('recordId').value = ''; // Clear hidden ID field
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('messageText').value = '';
        document.getElementById('submitBtn').textContent = 'Save Record'; // Reset button text
    }

    async function displaySavedData() {
        const savedTableBody = document.getElementById('savedTableBody');
        savedTableBody.innerHTML = ''; // Clear existing table rows

        try {
            const records = await getAllRecords();
            if (records.length === 0) {
                const row = savedTableBody.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 5; // Span across all columns
                cell.textContent = 'No records found.';
                cell.style.textAlign = 'center';
                return;
            }

            records.forEach(record => {
                const row = savedTableBody.insertRow();
                row.insertCell(0).textContent = record.id;
                row.insertCell(1).textContent = record.name;
                row.insertCell(2).textContent = record.email;
                row.insertCell(3).textContent = record.message;

                const actionsCell = row.insertCell(4);
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.classList.add('editBtn');
                editBtn.dataset.recordId = record.id; // Store ID for editing
                actionsCell.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.classList.add('deleteBtn');
                deleteBtn.dataset.recordId = record.id; // Store ID for deleting
                actionsCell.appendChild(deleteBtn);
            });
        } catch (error) {
            console.error('Error displaying saved data:', error);
            showMessage('Failed to display saved data.', 'error');
        }
    }

    // --- Event Listeners ---

    const dataForm = document.getElementById('dataForm');
    dataForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission

        const recordId = document.getElementById('recordId').value;
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('messageText').value;

        if (!name || !email || !message) {
            showMessage('All fields are required!', 'error');
            return;
        }

        const record = { name, email, message };

        if (recordId) {
            // If recordId exists, it's an update
            record.id = parseInt(recordId, 10); // Ensure the ID is an integer for update
            try {
                await updateRecord(record);
                clearForm();
                displaySavedData(); // Refresh the table
            } catch (error) {
                // Error handled by updateRecord
            }
        } else {
            // Otherwise, it's a new record
            try {
                await addRecord(record);
                clearForm();
                displaySavedData(); // Refresh the table
            } catch (error) {
                // Error handled by addRecord
            }
        }
    });

    const savedTableBody = document.getElementById('savedTableBody');
    savedTableBody.addEventListener('click', async (event) => {
        // Use event delegation to handle clicks on dynamically created buttons
        const target = event.target;

        if (target.classList.contains('editBtn')) {
            // FIX: Parse the string ID from dataset to an integer
            const recordId = parseInt(target.dataset.recordId, 10);
            if (isNaN(recordId)) {
                showMessage('Invalid record ID for editing.', 'error');
                return;
            }
            try {
                // Pass the numeric ID to getRecordById
                const recordToEdit = await getRecordById(recordId);
                if (recordToEdit) {
                    populateFormForEdit(recordToEdit);
                } else {
                    showMessage('Record not found for editing.', 'error');
                }
            } catch (error) {
                console.error('Error loading record for editing:', error);
                // Message already shown by getRecordById
            }
        } else if (target.classList.contains('deleteBtn')) {
            // FIX: Parse the string ID from dataset to an integer for deletion as well
            const recordId = parseInt(target.dataset.recordId, 10);
            if (isNaN(recordId)) {
                showMessage('Invalid record ID for deletion.', 'error');
                return;
            }
            if (confirm('Are you sure you want to delete this record? This cannot be undone.')) {
                try {
                    // Pass the numeric ID to deleteRecord
                    await deleteRecord(recordId);
                    showMessage('Record deleted successfully.', 'success');
                    // Re-display data after deletion for immediate feedback
                    document.getElementById('viewDataBtn').click();
                } catch (error) {
                    console.error('Error deleting record:', error);
                    // Message already shown by deleteRecord
                }
            }
        }
    });

    document.getElementById('viewDataBtn').addEventListener('click', displaySavedData);

    document.getElementById('clearDataBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            try {
                await clearAllRecords();
                displaySavedData(); // Refresh the table to show it's empty
            } catch (error) {
                // Error handled by clearAllRecords
            }
        }
    });

    document.getElementById('cancelEditBtn').addEventListener('click', clearForm);
});
