const express = require('express');
const cron = require('node-cron');
const bodyParser = require('body-parser'); // Import body-parser
const app = express();

// Use bodyParser middleware to parse JSON requests
app.use(bodyParser.json());

const port = 3000;

const expenses = [];
const reports = {
    daily: [],
    weekly: [],
    monthly: [],
};

// Post endpoint for logging expenses
app.post('/expenses', (req, res) => {
    const { category, amount, date } = req.body; // Use req.body instead of req.query

    if (!category || !amount || !date) {
        return res.status(400).json({ 
            status: "error", 
            message: "Missing required fields: category, amount, or date" 
        });
    }

    const expense = {
        id: expenses.length + 1,
        category,
        amount: parseFloat(amount),
        date: new Date(date),
    };

    expenses.push(expense);
    res.status(201).json({ 
        status: "success", 
        data: expense 
    });
});

// Get all expenses
app.get('/expenses', (req, res) => {
    res.json({ 
        status: "success", 
        data: expenses 
    });
});

// Get reports by type (daily, weekly, monthly)
app.get('/reports/:type', (req, res) => {
    const { type } = req.params;
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
        return res.status(400).json({ 
            status: "error", 
            message: "Invalid report type. Use 'daily', 'weekly', or 'monthly'." 
        });
    }

    res.json({ 
        status: "success", 
        data: reports[type] 
    });
});

// Endpoint to analyze expenses
app.get('/expenses/analysis', (req, res) => {
    const totalByCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.json({ 
        status: "success", 
        data: { 
            totalByCategory, 
            totalAmount 
        } 
    });
});

// Schedule cron jobs for generating reports
cron.schedule('0 0 * * *', () => {
    generateReport('daily');
});

cron.schedule('0 0 * * 0', () => {
    generateReport('weekly');
});

cron.schedule('0 0 1 * *', () => {
    generateReport('monthly');
});

// Function to generate reports for different periods
function generateReport(period) {
    const now = new Date();
    let startDate;

    // Calculate start date based on period (daily, weekly, monthly)
    if (period === 'daily') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
    } else if (period === 'weekly') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    // Filter expenses that fall within the period range
    const filteredExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startDate && expDate <= now;
    });

    // Calculate total by category and total amount
    const totalByCategory = filteredExpenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Generate the report
    const report = {
        period,
        generatedAt: new Date(),
        totalAmount,
        totalByCategory,
    };

    // Push the report to the corresponding period array
    reports[period].push(report);
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`); // Corrected template string
});



