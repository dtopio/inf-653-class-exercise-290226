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

app.use(express.urlencoded({ extended: true }));

// Static files (so /uploads/... renders)
app.use(express.static(path.join(__dirname, "public")));


global.reports = [
  {
    id: "1",
    name: "Blue Wallet",
    description: "Leather wallet with student ID",
    location: "Library Hall B",
    date: "2023-10-25",
    contact: "student@univ.edu",
    imagePath: "/uploads/filename.jpg",
    status: "Lost",
    imagePath: "/uploads/mock-wallet.jpg",
  },
  {
    id: "2",
    name: "Silver Water Bottle",
    description: "1L insulated bottle with stickers.",
    location: "Gym Entrance",
    date: "2026-02-24",
    contact: "owner2@example.com",
    status: "Found",
    imagePath: "",
  },
  {
    id: "3",
    name: "Blue Backpack",
    description: "Backpack with laptop charger and notebooks.",
    location: "Cafeteria",
    date: "2026-02-23",
    contact: "owner3@example.com",
    status: "Closed",
    imagePath: "/uploads/mock-backpack.jpg",
  },
]; 

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
  res.render("dashboard", {
    title: "Dashboard",
    reports: global.reports,
  });
});
// TODO: branch → feature/item-detail
app.get("/items/:id", (req, res) => {
  // render the detail view for a single item
  const report = findReport(req.params.id);
  if (!report) return res.status(404).send("Report not found");

  return res.render("item_detail", {
    title: `Item Detail - ${report.name}`,
    report,
  });
});

app.post("/items/:id/status", (req, res) => {
  const report = findReport(req.params.id);
  if (!report) return res.status(404).send("Report not found");

  const allowedStatuses = ["Lost", "Found", "Closed"];
  const nextStatus = req.body.status;

  if (!allowedStatuses.includes(nextStatus)) {
    return res.redirect(`/items/${req.params.id}`);
  }

  report.status = nextStatus;
  return res.redirect(`/items/${req.params.id}`);
});

app.post("/items/:id/delete", (req, res) => {
  global.reports = global.reports.filter((r) => r.id !== req.params.id);
  return res.redirect("/dashboard");
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
