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


// GET /report – render the report submission form
app.get("/report", (req, res) => {
  res.render("report", { title: "Report a Lost Item" });
});

// POST /report – parse multipart upload, validate, save, redirect
app.post("/report", (req, res) => {
  const form = new multiparty.Form();

  form.parse(req, (err, fields, files) => {
    if (err) return res.redirect("/report");

    const name        = fields.name?.[0]?.trim();
    const description = fields.description?.[0]?.trim();
    const location    = fields.location?.[0]?.trim();
    const date        = fields.date?.[0]?.trim();
    const contact     = fields.contact?.[0]?.trim();
    const imageFile   = files.image?.[0];

    if (!name || !description || !location || !date || !contact || !imageFile) {
      return res.redirect("/report");
    }

    const uploadsDir = ensureUploadsDir();
    const ext      = path.extname(imageFile.originalFilename) || ".jpg";
    const filename = `${Date.now()}${ext}`;
    const destPath = path.join(uploadsDir, filename);

    // Move temp file to public/uploads
    fs.rename(imageFile.path, destPath, (renameErr) => {
      if (renameErr && renameErr.code === "EXDEV") {
        fs.copyFile(imageFile.path, destPath, (copyErr) => {
          if (copyErr) return res.redirect("/report");
          fs.unlink(imageFile.path, () => {});
          saveReport();
        });
      } else if (renameErr) {
        return res.redirect("/report");
      } else {
        saveReport();
      }
    });

    function saveReport() {
      const report = {
        id: String(Date.now()),
        name,
        description,
        location,
        date,
        contact,
        imagePath: `/uploads/${filename}`,
        status: "Lost",
      };
      global.reports.push(report);
      res.redirect("/dashboard");
    }
  });
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard", { title: "Dashboard", reports: global.reports });
});

// TODO: branch → feature/item-detail
app.get("/items/:id", (req, res) => {
  // render the detail view for a single item
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
