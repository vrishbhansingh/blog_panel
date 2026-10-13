import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";

/**
 * TinyMCE retains clipboard HTML tables. The former Delta-based editor
 * converted cells into separate lines, so tables looked broken after paste.
 */
const RichTextEditor = ({ value, onChange, uploadImage }) => {
  const uploadImageRef = useRef(uploadImage);
  const [editorReady, setEditorReady] = useState(Boolean(window.tinymce));
  const [loadError, setLoadError] = useState("");
  uploadImageRef.current = uploadImage;

  useEffect(() => {
    if (window.tinymce) { setEditorReady(true); return undefined; }
    let active = true;

    // Load the locally installed editor only on the blog form. Loading these
    // modules at app startup can make the entire dashboard blank if a browser
    // extension blocks one of the editor assets.
    import("tinymce/tinymce")
      .then(() => Promise.all([
        import("tinymce/icons/default"),
        import("tinymce/themes/silver"),
        import("tinymce/models/dom"),
        // The npm build of TinyMCE cannot fetch its skin at runtime. Without
        // these bundled skin files the editor renders as an empty/invisible box.
        import("tinymce/skins/ui/oxide/skin"),
        import("tinymce/skins/ui/oxide/content"),
        import("tinymce/skins/content/default/content"),
        import("tinymce/plugins/advlist"),
        import("tinymce/plugins/autolink"),
        import("tinymce/plugins/code"),
        import("tinymce/plugins/fullscreen"),
        import("tinymce/plugins/image"),
        import("tinymce/plugins/link"),
        import("tinymce/plugins/lists"),
        import("tinymce/plugins/table"),
      ]))
      .then(() => { if (active) setEditorReady(true); })
      .catch(() => { if (active) setLoadError("Editor could not be loaded. Please refresh the page."); });

    return () => { active = false; };
  }, []);

  const chooseAndUploadImage = (callback) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        callback(await uploadImageRef.current(file), { alt: file.name });
      } catch (error) {
        alert(error.response?.data?.error || "Image upload failed");
      }
    };
    input.click();
  };

  if (loadError) return <div className="notice error">{loadError}</div>;
  if (!editorReady) return <div className="rich-text-editor-editor-loading">Loading editor…</div>;

  return <div className="rich-text-editor tinymce-editor-wrap">
    <Editor
      value={value || ""}
      disabled={false}
      onEditorChange={onChange}
      init={{
        license_key: "gpl",
        height: 480,
        menubar: false,
        branding: false,
        // This toolbar matches the editor you supplied from the CRM panel.
        // The table plugin is kept enabled in the background so pasted tables
        // remain valid HTML, without adding an extra table button to its UI.
        plugins: "advlist autolink lists link image table code fullscreen",
        toolbar: "undo redo | blocks | bold italic underline strikethrough | subscript superscript | forecolor backcolor | bullist numlist outdent indent | alignleft aligncenter alignright alignjustify | blockquote link image | removeformat | code fullscreen",
        toolbar_mode: "wrap",
        table_default_attributes: { border: "1" },
        table_default_styles: { borderCollapse: "collapse", width: "100%" },
        table_sizing_mode: "responsive",
        content_style: "body { font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.55; padding:8px; } table { border-collapse:collapse; width:100%; margin:1em 0; } th, td { border:1px solid #b8c0b5; padding:8px; vertical-align:top; } th { background:#f1f4ef; font-weight:700; }",
        // Keep headings, paragraph spacing, tables and cells from pasted HTML.
        paste_data_images: false,
        file_picker_types: "image",
        file_picker_callback: (callback) => chooseAndUploadImage(callback),
        images_upload_handler: async (blobInfo) => uploadImageRef.current(blobInfo.blob()),
      }}
    />
  </div>;
};

export default RichTextEditor;
