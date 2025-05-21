# Installation and Usage Guide

## Description
This project allows you to process Mermaid diagrams (`.mmd` files) and convert them into PDF format. The application supports processing `.mmd` files from a specified input directory and its subdirectories, and saves the output in a structured `output/` directory.

## Installation

1. **Clone the Repository**  
   Clone this repository to your local machine:
   ```bash
   git clone https://github.com/your-repository-name.git
   ```

2. **Navigate to the Project Directory**  
   Move into the project folder:
   ```bash
   cd your-repository-name
   ```

3. **Install Dependencies**  
   Install the required dependencies using npm:
   ```bash
   npm install
   ```

## Usage

1. **Prepare Your Diagram Files**  
   Place your `.mmd` files (Mermaid diagrams) in the `mmd-file/` directory. The application will automatically process all `.mmd` files in this directory and its subdirectories.

2. **Run the Application**  
   Execute the script to process the `.mmd` files:
   ```bash
   node main.js [scale-percentage]
   ```
   - Replace `[scale-percentage]` with the desired scaling percentage (default is `100` if not specified).

3. **View the Output**  
   The processed PDF files will be saved in the `output/` directory, maintaining the same folder structure as the `mmd-file/` directory.

## Example

To process `.mmd` files with a scale percentage of 100:
```bash
node main.js 100
```

## Notes

- Ensure you have Node.js installed on your system.
- For Mermaid syntax and examples, refer to the [Mermaid documentation](https://mermaid.js.org/).
- The `output/` directory will be created automatically if it does not exist.

Feel free to contact us if you encounter any issues or have questions!