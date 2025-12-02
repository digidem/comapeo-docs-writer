# Building a Custom Categories Set

Element Type: Page
Publish Status: Draft published
Drafting Status : To Improve after launch
Assignment Notes: Assignment: PS Doc section → Preparing to Use CoMapeo (pg 2-3)[Preparing Equipment & Categories] (https://www.notion.so/Assignment-PS-Doc-section-Preparing-to-Use-CoMapeo-pg-2-3-Preparing-Equipment-Categories-2331b08162d58009a75ddfd3ad2487b9?pvs=21)
↳ Assignment Target Date: August 14, 2025
Content Section: 10-Preparing to use CoMapeo
↳ Page Order: 12
Language: English
Parent item: Building a Custom Categories Set (Building%20a%20Custom%20Categories%20Set%202331b08162d580809189cd7026f01565.md)

# Building a Custom Category Set

![](./images/extracted_a3afea012c1c.png)

## About Categories in CoMapeo

### **What is a category in CoMapeo?**

A category is a predetermined icon, label, and detail questions for any data type being collected. For each observation made with CoMapeo, participants select a category to classify it, and may answer questions or respond to prompts to provide more detail about what is being documented.

**What are Category Sets in CoMapeo?**

Category Sets are files that contain and define the distinct Categories for a Project. Creating config used to require coding skills that limited the possibility for people to customize their own categories. We have now made it more accessible through a spreadsheet template that we explain in this section.

<aside>
💡

For those familiar with the predecessor app Mapeo, Category Sets were previously known as *Configurations.*

</aside>

---

## Why customize Category Sets?

[VIDEO WALKTHROUGH]

**Reasons for customizing CoMapeo Category Sets**

- Custom Categories are a powerful tool for customization in CoMapeo, allowing users to define specific icons, and questionnaires for their projects.
- Text can be written in any language that can be typed, ensuring that key parts of the data collection interface can appear in the native language of the groups using it.

**Reflect and organize information you will need**

Initial planning and consultation with project participants is essential to designing effective ways of organizing your data. To start the customization process, project participants should reflect on the project goals, what kind of data will be needed, and what properties might be required for data outputs.

You will need to think through what to include for each of the **key customizable areas of CoMapeo.**

| Categories component | Description | Format |
| --- | --- | --- |
| [**Categor](https://docs.mapeo.app/complete-reference-guide/customization-options/custom-configurations/creating-custom-configurations/planning-configuration-and-data-structure/categories)y Name** | When collecting or creating data with CoMapeo, users assign a top-level category to each observation or element on the map | text (recommended less than x characters for best display |
| [**Icon**](https://docs.mapeo.app/complete-reference-guide/customization-options/custom-configurations/creating-custom-configurations/planning-configuration-and-data-structure/icons) | Each Category you include must have an icon or a small graphic to display to users when selecting a category. | png, (max 100px) |
| Color | Color appears as observations on :app-icon-map: map view and in the :app-icon-all-projects-grid:Category selection screen. It helps to use thematic groups when defining colors functioning like a map legend. | [Hex colour code](https://htmlcolorcodes.com/color-picker/) |
| [**Details fields**](https://docs.mapeo.app/complete-reference-guide/customization-options/custom-configurations/creating-custom-configurations/planning-configuration-and-data-structure/details-fields) | For each Category in your Category Set, you can include one or more structured data fields (like a mini form or questionnaire) that users can optionally fill out when creating a new observation or map element with that category. | Text prompt and with fields that can be filled with values that are typed text, single select, or multiple select. The values can be text. Note that single select options may be preferred for data processing when organizing or doing analysis |

## Using the **CoMapeo Category Generator Spreadsheet**

Once you have this information, use the  to create your categories. This tool will allow you to create and edit Categories, icons, details fields and language, and export all this information into a **.comapeocat** file

Whether you imported a Mapeo config or are starting from scratch, you will find these two main sheets named in tabs on the bottom of Googlesheets 

**→ Categories sheet** to define category name, icon and colour 

**→ Details sheet** to create a simple form included in different categories

<aside>
👉🏽

Download the **CoMapeo Category Generator**

</aside>

<aside>
👣

### **Converting Legacy Mapeo Configurations**

The following instructions are for importing a legacy Mapeo configuration file (.mapeosettings) into a **CoMapeo Category Generator Spreadsheet**
This tool will transfer the information structure into the spreadsheet into the columns described below.

1. Download Mapeo config file (ending in .mapeosettings)into the computer that you will use to customize your CoMapeo Category Set. If you have it in a zip file, make sure you unzip it first and extract your file to have it available as .mapeosettings file where you can easily find it.
2. Open this [spreadsheet](https://docs.google.com/spreadsheets/d/195Zb0URLP_PP5h4_28mFu33cFem76rLO-es9rjckZ5k/edit?gid=169401870#gid=169401870) template in your browser and make your own copy. We recommend including the name of your project and version in the name file and date, considering you might go through different iterations of customizing your categories, and you will want to know which is the most updated file.
3. NOTE! This tool does not work with any Google spreadsheet. Make sure that the copy you make of the template has **“CoMapeo Tools” on the right of the top menu**. This means this spreadsheet has the script that will generate your .comapeocat file. If you want access to previous iterations of your category file, create a copy for each iteration, rather than just editing their version, and update the name and date fo the copy.
4. Go to the top menu (below file title) and click on **CoMapeo Tools -> Import CoMapeo Confi**g. If you can’t find it, reload the page.
    
    ![2025-08-26_04-52_1.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_04-52_1.png)
    
5. Locate the Mapeo config file you want to convert and click “Upload”. You may get a warning about authorisation needed -> Click Ok -> give all permissions requested -> select “Continue”.
    
    ![2025-08-26_04-53.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_04-53.png)
    
6. Once you have given permissions, go back to the “CoMapeo Tools” menu and click again on “Import Configuration File” -> Drag or drop your .mapeosettings file here. If you imported your file from Mapeo, the cells will be filled automatically.
    
    ![2025-08-26_04-55.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_04-55.png)
    
7. **Icons** (COLUMN B) If you are working from a Mapeo config open your Mapeo configuration file and within the list of files and folders find the one that says “Icons”. Upload it to a GDrive folder. 
</aside>

### **Categories sheet contents**

**Names** (COLUMN A) Use the column titled English (by included) to type the name of each category. You can change the language to the one you are using as your included language.

![2025-08-26_04-52.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_04-52.png)

**Icons** (COLUMN B) This is a link (URL) to an image in **SVG format** in an associated Google Shared folder. 

![2025-08-26_08-31.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_08-31.png)

<aside>
👣

- **Step by step**
    
    ***Step 1:*** Open a folder in your GDrive and name it “icons”. 
    
    ***Step 2:*** In the folder, make sure the sharing settings are “anyone with the link”. 
    
    ***Step 3:*** Right-click on the icon of your choice 
    
    ![2025-08-26_09-20.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_09-20.png)
    
    ***Step 4:*** Click on Share -> Copy Link. 
    
    ***Step 5:*** Paste it in the Icon column, next to the category name that you want it to represent.
    
</aside>

<aside>
💡

**Tip:** Naming the file with the name of the category will help you keep order and make sure you have the right image for the right category. 

</aside>

<aside>
👉🏽

**More:** Use the [**Mapeo icon generator**](https://icons.earthdefenderstoolkit.com/) to create images into svg files, choosing among colors and options it provides. 

![icon.png](Building%20a%20Custom%20Categories%20Set/icon.png)

![2025-08-27_06-46_1.png](Building%20a%20Custom%20Categories%20Set/2025-08-27_06-46_1.png)

![2025-08-26_08-28.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_08-28.png)

Follow the steps displayed on the tool, and once you have downloaded them into your computer, upload them into your “icons” folder and continue with step 

When you create an icon using the **CoMapeo Icon Generator,** you will find a **hex color code** below your svg file options. Use this for COLUMN D.

</aside>

**Details** (COLUMN C) 
Choose the list of questions you want to add to each category. Select the details that you want to add to each category row. 

<aside>
💡

**Tip:** To populate to the list of details to select from  n the **Categories sheet ,** use the **Details sheet.**  

</aside>

![2025-08-26_09-02.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_09-02.png)

**Color** (COLUMN D)  
Add a thematic color in [hex code format](https://htmlcolorcodes.com/color-picker/) in which each observation will be shown as a point in the :app-icon-map: map to improve experience of viewing diverse data . 
Example: #1F8C55**.** 

<aside>
💡

**Tip:** Use the “Fill color” spreadsheet tool to fill rows or cells with the color matching hex color code to help with creating a useful legend. 

![2025-08-26_09-40.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_09-40.png)

</aside>

### Details sheet content

Here you can customize the questions you want to ask for each category. 

**Label** - This works like a title for the detail that appears as options in Column D in the Categories sheet.

**Helper text** - This explains what that detail field is for or a prompt question

**Type** of response you want to get as detail: 

- **Text** for written responses
- **Number** for numerical responses
- **Multiple** for a list of options
    
    To write the list of multiple options for a response, write them within the same cell under the Column D. Write a comma after each option to indicate these are separate options.
    

![2025-08-26_09-36.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_09-36.png)

### **Exporting the Category Set File**

After the spreadsheet content has been filled in completely, a **.comapeocat file** is ready to be exported by the **CoMapeo Category Generator**

<aside>
👣

### **Step by step**

***Step 1:*** To export the category file, first review that all tabs are ready and do not show any red, orange or yellow color indicating an error. If you want to double check, go to CoMapeo Tools -> Lint Sheets and it will show you any of these. 

![2025-08-26_10-02.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_10-02.png)

<aside>
⚠️

WARNING: Common errors to watch out for: -Go to the **“Details”** tab and check that there are no commas in the labels, especially if you have phrases longer than 1 or 2 words. Commas indicate to the spreadsheet the end of a label and the beginning of the next one, so having commas in a phrase will split it into different labels. -Go to the **“Categories”** tab and check that the labels in the “Labels” column are correct. If you find any mistakes, go to the “Detail” tab and correct the text there. Refresh the spreadsheet. If there are errors (such as commas) you will see a red corner on the left side of the cells under the “Detail” columns. You can always go back to the “Details” tab and fix typos, mistakes, and refresh the spreadsheet.

</aside>

***Step 2:*** Once its ready go to the top menu and click on CoMapeo Tools -> Generate CoMapeo Category.

![2025-08-26_04-52_1.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_04-52_1%201.png)

***Step 3:*** Choose a language to translate to. At this moment, you have to choose at least one language for the export to work.

![2025-08-26_10-03.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_10-03.png)

***Step 4:*** After completing 8 automatic steps, the spreadsheet will show a “Download file” button. The file will be in a zip folder, open it and find it ending in comapeocat.

![2025-08-26_10-16.png](Building%20a%20Custom%20Categories%20Set/2025-08-26_10-16.png)

</aside>

## **Translations**

When you generate a CoMapeo Category File, the spreadsheet automatically creates other sheets as tabs at the bottom of the spreadsheet. Each new sheet contains automated translations from the language you selected. 

<aside>
⚠️

**Warning:** These translations use Google Translate and will likely need your revision and improvement. Click on each cell to edit or improve the translations.

</aside>

## **Testing out new categories**

An important part of the process is to test out the custom categories set created in CoMapeo Mobile. It can be helpful to include a couple teammates to help catch any improvements needed. 

Go to 🔗 [**Changing Categories Set](/docs/changing-categories-set )**  for instructions on importing .comapeocat files

Revisions must be made in the **CoMapeo Category Generator.** Repeat the export steps again, and test as needed.

## Related Content

Go to 🔗 [**New Tool: Mapeo Icons Generator](https://www.earthdefenderstoolkit.com/new-tool-mapeo-icons-generator/)** blogpost by Luandro Vieira.

Go to 🔗 [**Welcome to CoMapeo Cateogries Library](https://www.earthdefenderstoolkit.com/welcome-to-the-comapeo-categories-library/)** blogpost by María Alvarez

---

### Having Problems?

Go to 🔗 [**Troubleshooting: Setup and Customization → Custom Categories Set Problems](/docs/troubleshooting-setup-and-customization/#custom-category-set-problems)** 

---