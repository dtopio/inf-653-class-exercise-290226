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

app.get("/report", (req, res) => {
  res.render("report", { title: "Report Lost Item" });
});

app.post("/report", (req, res) => {
  ensureUploadsDir();

  const form = new multiparty.Form({
    uploadDir: path.join(__dirname, "public", "uploads"),
  });

  form.parse(req, (err, fields, files) => {
    if (err) return res.redirect("/report");

    const name = (fields.name?.[0] || "").trim();
    const description = (fields.description?.[0] || "").trim();
    const location = (fields.location?.[0] || "").trim();
    const date = (fields.date?.[0] || "").trim();
    const contact = (fields.contact?.[0] || "").trim();

    const imageFile = files.image?.[0]; // name="image" in form

    // Backend validation: all fields + file required
    if (!name || !description || !location || !date || !contact || !imageFile) {
      // If multiparty already uploaded a temp file, you could unlink it here (optional).
      return res.redirect("/report");
    }

    // Make a nicer filename; keep the file multiparty stored but rename it
    const original = imageFile.originalFilename || "upload";
    const safeOriginal = original.replace(/[^\w.\-]/g, "_");
    const finalName = `${Date.now()}_${safeOriginal}`;
    const finalDiskPath = path.join(__dirname, "public", "uploads", finalName);

    try {
      fs.renameSync(imageFile.path, finalDiskPath);
    } catch (e) {
      return res.redirect("/report");
    }

    const report = {
      id: String(Date.now()), // allowed unique_string approach
      name,
      description,
      location,
      date,
      contact,
      imagePath: `/uploads/${finalName}`,
      status: "Lost",
    };

    global.reports.push(report);
    return res.redirect("/dashboard");
  });
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    title: "Dashboard",
    reports: global.reports,
  });
});