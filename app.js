const path = require("path");
const fs = require("fs");
const express = require("express");
const multiparty = require("multiparty");
const { engine } = require("express-handlebars");

const app = express();
const PORT = process.env.PORT || 3000;

// Security: remove X-Powered-By header
app.disable("x-powered-by"); 

// View engine: Handlebars (main layout + partials)
app.engine('handlebars', engine({
  defaultLayout: 'main',              
  extname: '.handlebars',             
  partialsDir: ['views/partials/'],   
  helpers: {
    section: function(name, options) {
      if (!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    }
  }
}));

app.set('view engine', 'handlebars');
app.set("views", path.join(__dirname, "views"));

// Static files (so /uploads/... renders)
app.use(express.static(path.join(__dirname, "public")));

// In-memory persistence (global array)
global.reports = []; // required style: in-memory array

function findReport(id) {
  return global.reports.find((r) => r.id === id);
}

function ensureUploadsDir() {
  const dir = path.join(__dirname, "public", "uploads");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Routes
app.get("/", (req, res) => res.redirect("/report"));

// TODO: branch → feature/report-form
app.get("/report", (req, res) => {
  // render the report submission form
});

app.post("/report", (req, res) => {
  // handle form submission (multipart/form-data)
});

// TODO: branch → feature/dashboard
app.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    reports: global.reports
  });
});

// TODO: branch → feature/item-detail
app.get("/items/:id", (req, res) => {
  // render the detail view for a single item
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
