import React, { useMemo, useRef } from "react";
import { Editor } from "@tinymce/tinymce-react";
import tinymce from "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/themes/silver";
import "tinymce/models/dom";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/ui/oxide/content.min.css";
import "tinymce/skins/content/default/content.min.css";
import "tinymce/plugins/advlist";
import "tinymce/plugins/anchor";
import "tinymce/plugins/autolink";
import "tinymce/plugins/charmap";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/image";
import "tinymce/plugins/insertdatetime";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/media";
import "tinymce/plugins/preview";
import "tinymce/plugins/searchreplace";
import "tinymce/plugins/table";
import "tinymce/plugins/visualblocks";
import "tinymce/plugins/wordcount";

// Load TinyMCE from this bundle, not from an external CDN or API key.
window.tinymce = tinymce;

/**
 * Full visual blog editor. TinyMCE preserves semantic rich content copied from
 * Word, websites and ChatGPT: headings, bold text, lists, links and tables.
 * It also provides table editing controls, source editing and image uploads.
 */
const RichTextEditor = ({ value, onChange, uploadImage }) => {
  const uploadImageRef = useRef(uploadImage);
  uploadImageRef.current = uploadImage;

  const init = useMemo(() => ({
    height: 560,
    menubar: "edit view insert format tools table help",
    plugins: "advlist anchor autolink charmap code fullscreen image insertdatetime link lists media preview searchreplace table visualblocks wordcount",
    toolbar: [
      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor",
      "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media",
      "table | tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | tablemergecells tablesplitcells",
      "removeformat | code fullscreen preview",
    ],
    toolbar_mode: "wrap",
    block_formats: "Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Quote=blockquote; Preformatted=pre",
    font_family_formats: "Arial=arial,helvetica,sans-serif; Georgia=georgia,palatino,serif; Times New Roman='times new roman',times,serif; Verdana=verdana,geneva,sans-serif",
    table_default_attributes: { border: "1" },
    table_default_styles: { borderCollapse: "collapse", width: "100%" },
    table_toolbar: "tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | tablemergecells tablesplitcells",
    image_title: true,
    automatic_uploads: true,
    paste_data_images: true,
    paste_as_text: false,
    paste_webkit_styles: "all",
    images_upload_handler: async (blobInfo) => uploadImageRef.current(blobInfo.blob()),
    content_style: "body { font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; } table { border-collapse: collapse; width: 100%; margin: 1em 0; } td, th { border: 1px solid #9ca3af; padding: 8px; vertical-align: top; } th { background: #f3f4f6; } img { max-width: 100%; height: auto; }",
  }), []);

  return <div className="rich-text-editor tinymce-editor">
    <Editor tinymceScriptSrc={[]} value={value} onEditorChange={onChange} init={init} />
  </div>;
};

export default RichTextEditor;
